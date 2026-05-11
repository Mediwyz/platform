import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../api/client.dart';
import '../theme/mediwyz_theme.dart';
import '../widgets/app_drawer.dart';
import '../widgets/skeleton.dart';

/// Insurance claims page — dual view (member vs owner). Member files a
/// claim; owner approves or denies. Backend alias `?as=owner` switches
/// the list scope. Mirrors `/insurance/claims` on web.
class InsuranceClaimsSubmitScreen extends ConsumerStatefulWidget {
  const InsuranceClaimsSubmitScreen({super.key});
  @override
  ConsumerState<InsuranceClaimsSubmitScreen> createState() => _InsuranceClaimsSubmitScreenState();
}

class _InsuranceClaimsSubmitScreenState extends ConsumerState<InsuranceClaimsSubmitScreen> {
  bool _asOwner = false;
  bool _loading = true;
  List<Map<String, dynamic>> _claims = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.instance.get(
        '/corporate/insurance/claims',
        queryParameters: _asOwner ? {'as': 'owner'} : null,
      );
      final data = (res.data as Map?)?['data'] as List?;
      _claims = data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? [];
    } catch (_) { _claims = []; }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _review(String id, String action, {String? note}) async {
    try {
      final res = await ApiClient.instance.post(
        '/corporate/insurance/claims/$id/$action',
        data: {if (note != null && note.isNotEmpty) 'reviewerNote': note},
      );
      final ok = (res.data as Map?)?['success'] == true;
      if (!ok) throw Exception('fail');
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(action == 'approve' ? 'Claim approved · wallet credited' : 'Claim declined'),
            backgroundColor: action == 'approve' ? Colors.green : Colors.orange,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed — try again'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _openSubmitForm() async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _SubmitClaimForm(),
    );
    if (ok == true) _load();
  }

  ({Color bg, Color fg, IconData icon, String label}) _statusChip(String s) {
    switch (s) {
      case 'approved': return (bg: Colors.blue.shade50, fg: Colors.blue.shade700, icon: Icons.check_circle_outline, label: 'Approved');
      case 'paid':     return (bg: Colors.green.shade50, fg: Colors.green.shade700, icon: Icons.paid_outlined, label: 'Paid');
      case 'denied':   return (bg: Colors.red.shade50, fg: Colors.red.shade700, icon: Icons.cancel_outlined, label: 'Declined');
      default:         return (bg: Colors.amber.shade50, fg: Colors.amber.shade800, icon: Icons.hourglass_empty, label: 'Pending');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: const Row(children: [
          Icon(Icons.description_outlined, color: MediWyzColors.teal),
          SizedBox(width: 8),
          Text('Insurance claims', style: TextStyle(fontWeight: FontWeight.bold)),
        ]),
      ),
      floatingActionButton: _asOwner
          ? null
          : FloatingActionButton.extended(
              onPressed: _openSubmitForm,
              backgroundColor: MediWyzColors.teal,
              icon: const Icon(Icons.add, color: Colors.white),
              label: const Text('File claim', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 6),
            child: SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: false, label: Text('My claims'), icon: Icon(Icons.person_outline, size: 16)),
                ButtonSegment(value: true, label: Text('As owner'), icon: Icon(Icons.shield_outlined, size: 16)),
              ],
              selected: {_asOwner},
              onSelectionChanged: (s) { setState(() => _asOwner = s.first); _load(); },
            ),
          ),
          Expanded(
            child: _loading
                ? const Padding(padding: EdgeInsets.all(12), child: SkeletonList(lineCount: 4))
                : _claims.isEmpty
                    ? EmptyState(
                        icon: Icons.description_outlined,
                        title: _asOwner ? 'No claims against your company' : 'No claims yet',
                        description: _asOwner ? null : 'Tap "File claim" to submit one.',
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _claims.length,
                          itemBuilder: (_, i) => _buildCard(_claims[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard(Map<String, dynamic> c) {
    final status = c['status']?.toString() ?? 'pending';
    final chip = _statusChip(status);
    final amount = (c['amount'] as num?)?.toDouble() ?? 0;
    final company = c['company']?['companyName']?.toString();
    final memberName = (c['member'] is Map)
        ? '${c['member']['firstName'] ?? ''} ${c['member']['lastName'] ?? ''}'.trim()
        : null;
    final note = c['reviewerNote']?.toString();

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Text(
                  'MUR ${amount.toStringAsFixed(0)} · ${_asOwner ? (memberName ?? 'Member') : (company ?? 'Company')}',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: MediWyzColors.navy),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: chip.bg, borderRadius: BorderRadius.circular(10)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(chip.icon, size: 12, color: chip.fg),
                  const SizedBox(width: 3),
                  Text(chip.label, style: TextStyle(fontSize: 11, color: chip.fg, fontWeight: FontWeight.w600)),
                ]),
              ),
            ]),
            const SizedBox(height: 8),
            Text(c['description']?.toString() ?? '', style: const TextStyle(fontSize: 13, color: Colors.black87)),
            if (note != null && note.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text('Note: $note', style: const TextStyle(fontSize: 11, color: Colors.black54, fontStyle: FontStyle.italic)),
              ),
            if (_asOwner && status == 'pending') ...[
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => _review(c['id'].toString(), 'approve'),
                    icon: const Icon(Icons.check, size: 14),
                    label: const Text('Approve & pay'),
                    style: FilledButton.styleFrom(backgroundColor: Colors.green.shade600),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: () async {
                    final reason = await _promptReason();
                    if (reason != null) await _review(c['id'].toString(), 'deny', note: reason);
                  },
                  icon: const Icon(Icons.close, size: 14),
                  label: const Text('Decline'),
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red.shade700, side: BorderSide(color: Colors.red.shade300)),
                ),
              ]),
            ],
          ],
        ),
      ),
    );
  }

  Future<String?> _promptReason() async {
    final c = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Decline claim'),
        content: TextField(
          controller: c,
          decoration: const InputDecoration(hintText: 'Reason (optional)', border: OutlineInputBorder()),
          maxLines: 2,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, c.text.trim()),
            style: FilledButton.styleFrom(backgroundColor: Colors.red.shade600),
            child: const Text('Decline'),
          ),
        ],
      ),
    );
    c.dispose();
    return reason;
  }
}

/// Bottom-sheet form for filing a new claim — with OCR receipt scanning.
class _SubmitClaimForm extends StatefulWidget {
  const _SubmitClaimForm();
  @override
  State<_SubmitClaimForm> createState() => _SubmitClaimFormState();
}

class _SubmitClaimFormState extends State<_SubmitClaimForm> {
  String _step = 'upload'; // upload | scanning | review
  String? _companyId;
  final _descCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  List<Map<String, dynamic>> _companies = [];
  Uint8List? _imageBytes;
  String? _merchantInfo;
  String? _originalAmount;
  String? _receiptUrl;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCompanies();
    _amountCtrl.addListener(() { if (mounted) setState(() {}); });
  }

  Future<void> _loadCompanies() async {
    try {
      final res = await ApiClient.instance.get('/corporate/insurance-companies');
      final data = (res.data as Map?)?['data'] as List?;
      if (mounted) {
        setState(() {
          _companies = data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? [];
        });
      }
    } catch (_) {}
  }

  Future<void> _pickAndScan() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85, maxWidth: 1600);
    if (picked == null || !mounted) return;
    final bytes = await picked.readAsBytes();
    setState(() { _imageBytes = bytes; _step = 'scanning'; _error = null; });
    try {
      final formData = FormData.fromMap({
        'receipt': MultipartFile.fromBytes(bytes, filename: 'receipt.jpg'),
      });
      final res = await ApiClient.instance.post('/corporate/insurance/claims/ocr', data: formData);
      if ((res.data as Map?)?['success'] != true) {
        throw Exception((res.data as Map?)?['message']?.toString() ?? 'OCR failed');
      }
      final data = (res.data as Map?)?['data'] as Map?;
      _descCtrl.text = data?['description']?.toString() ?? '';
      final amt = (data?['amount'] as num?)?.toDouble();
      _originalAmount = amt?.toStringAsFixed(2);
      _amountCtrl.text = _originalAmount ?? '';
      _receiptUrl = data?['receiptUrl']?.toString();
      final merchant = data?['merchantName']?.toString();
      final date = data?['receiptDate']?.toString();
      _merchantInfo = [merchant, date].where((s) => s != null && s.isNotEmpty).join(' · ');
      setState(() => _step = 'review');
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _step = 'upload';
      });
    }
  }

  void _resetScan() {
    setState(() {
      _step = 'upload';
      _imageBytes = null;
      _merchantInfo = null;
      _originalAmount = null;
      _receiptUrl = null;
      _descCtrl.clear();
      _amountCtrl.clear();
    });
  }

  Future<void> _submit() async {
    if (_companyId == null || _descCtrl.text.trim().isEmpty || _amountCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Please fill in all required fields');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      final res = await ApiClient.instance.post('/corporate/insurance/claims', data: {
        'companyProfileId': _companyId,
        'description': _descCtrl.text.trim(),
        'amount': double.tryParse(_amountCtrl.text) ?? 0,
        if (_receiptUrl != null && _receiptUrl!.isNotEmpty) 'receiptUrl': _receiptUrl,
      });
      if ((res.data as Map?)?['success'] != true) {
        throw Exception((res.data as Map?)?['message']?.toString() ?? 'Failed');
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    _amountCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, bottom + 16),
      child: _step == 'scanning' ? _buildScanning() : _buildForm(),
    );
  }

  Widget _buildScanning() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 20),
        if (_imageBytes != null)
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.memory(_imageBytes!, height: 96, width: 96, fit: BoxFit.cover),
          ),
        const SizedBox(height: 16),
        const CircularProgressIndicator(color: MediWyzColors.teal, strokeWidth: 3),
        const SizedBox(height: 12),
        const Text('Scanning receipt with AI…', style: TextStyle(color: Colors.black54)),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildForm() {
    final amountChanged = _originalAmount != null && _amountCtrl.text.isNotEmpty && _amountCtrl.text != _originalAmount;
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(children: [
            const Expanded(child: Text('New claim', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
            if (_merchantInfo != null && _merchantInfo!.isNotEmpty)
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(20)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.check_circle, size: 12, color: Colors.green),
                    const SizedBox(width: 4),
                    Flexible(child: Text(_merchantInfo!, style: const TextStyle(fontSize: 10, color: Colors.green), overflow: TextOverflow.ellipsis)),
                  ]),
                ),
              ),
          ]),
          const SizedBox(height: 12),

          // ── Step: upload ──────────────────────────────────────────────
          if (_step == 'upload') ...[
            GestureDetector(
              onTap: _pickAndScan,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 28),
                decoration: BoxDecoration(
                  border: Border.all(color: MediWyzColors.teal.withOpacity(0.4), width: 1.5),
                  borderRadius: BorderRadius.circular(12),
                  color: MediWyzColors.teal.withOpacity(0.04),
                ),
                child: const Column(children: [
                  Icon(Icons.camera_alt_outlined, size: 32, color: MediWyzColors.teal),
                  SizedBox(height: 8),
                  Text('Upload receipt photo', style: TextStyle(color: MediWyzColors.teal, fontWeight: FontWeight.w500)),
                  SizedBox(height: 4),
                  Text('JPG, PNG · Max 10 MB', style: TextStyle(fontSize: 11, color: Colors.black45)),
                ]),
              ),
            ),
            const SizedBox(height: 6),
            TextButton(
              onPressed: () => setState(() => _step = 'review'),
              child: const Text('Skip scan — fill in manually', style: TextStyle(color: Colors.black45, fontSize: 12)),
            ),
          ],

          // ── Step: review ──────────────────────────────────────────────
          if (_step == 'review') ...[
            if (_imageBytes != null) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.memory(_imageBytes!, height: 110, fit: BoxFit.contain),
              ),
              const SizedBox(height: 12),
            ],
            DropdownButtonFormField<String>(
              value: _companyId,
              decoration: const InputDecoration(labelText: 'Insurance company *', border: OutlineInputBorder()),
              items: _companies
                  .map((c) => DropdownMenuItem(value: c['id']?.toString(), child: Text(c['companyName']?.toString() ?? '')))
                  .toList(),
              onChanged: (v) => setState(() => _companyId = v),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _descCtrl,
              decoration: const InputDecoration(labelText: 'Description *', border: OutlineInputBorder()),
              maxLines: 3,
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _amountCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Amount (MUR) *',
                border: const OutlineInputBorder(),
                prefixText: 'MUR ',
                helperText: amountChanged ? 'OCR read MUR $_originalAmount — you\'ve changed this' : null,
                helperStyle: TextStyle(color: Colors.amber.shade700, fontSize: 11),
              ),
            ),
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: _resetScan,
                icon: const Icon(Icons.refresh, size: 14),
                label: const Text('Re-scan', style: TextStyle(fontSize: 12)),
                style: TextButton.styleFrom(foregroundColor: Colors.black45, padding: EdgeInsets.zero),
              ),
            ),
          ],

          if (_error != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8)),
              child: Text(_error!, style: TextStyle(color: Colors.red.shade700, fontSize: 12)),
            ),
          ],

          if (_step == 'review') ...[
            const SizedBox(height: 14),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: MediWyzColors.teal, padding: const EdgeInsets.symmetric(vertical: 14)),
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Submit claim', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ],
      ),
    );
  }
}
