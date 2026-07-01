import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/mediwyz_theme.dart';
import 'page_kit.dart';

enum FieldType { text, number, multiline, toggle }

/// One field in a generic create/edit form.
class FormFieldSpec {
  final String key;
  final String label;
  final FieldType type;
  final bool required;
  const FormFieldSpec(this.key, this.label, {this.type = FieldType.text, this.required = false});
}

/// A generic create/edit bottom sheet. Renders each field, pre-fills from
/// [initial], and returns the collected values (or null if cancelled). Number
/// fields are parsed to num; toggles to bool.
Future<Map<String, dynamic>?> showEntityForm(
  BuildContext context, {
  required String title,
  required List<FormFieldSpec> fields,
  Map<String, dynamic>? initial,
  String submitLabel = 'Enregistrer',
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: kSurface(context),
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (ctx) => _EntityForm(title: title, fields: fields, initial: initial, submitLabel: submitLabel),
  );
}

class _EntityForm extends StatefulWidget {
  final String title;
  final List<FormFieldSpec> fields;
  final Map<String, dynamic>? initial;
  final String submitLabel;
  const _EntityForm({required this.title, required this.fields, this.initial, required this.submitLabel});
  @override
  State<_EntityForm> createState() => _EntityFormState();
}

class _EntityFormState extends State<_EntityForm> {
  late final Map<String, TextEditingController> _ctl;
  late final Map<String, bool> _toggles;
  String? _error;

  @override
  void initState() {
    super.initState();
    _ctl = {};
    _toggles = {};
    for (final f in widget.fields) {
      final v = widget.initial?[f.key];
      if (f.type == FieldType.toggle) {
        _toggles[f.key] = v == true;
      } else {
        _ctl[f.key] = TextEditingController(text: v == null ? '' : v.toString());
      }
    }
  }

  @override
  void dispose() {
    for (final c in _ctl.values) { c.dispose(); }
    super.dispose();
  }

  void _submit() {
    final out = <String, dynamic>{};
    for (final f in widget.fields) {
      if (f.type == FieldType.toggle) {
        out[f.key] = _toggles[f.key] ?? false;
        continue;
      }
      final raw = _ctl[f.key]!.text.trim();
      if (f.required && raw.isEmpty) { setState(() => _error = '${f.label} est requis.'); return; }
      if (raw.isEmpty) continue;
      out[f.key] = f.type == FieldType.number ? (num.tryParse(raw) ?? raw) : raw;
    }
    Navigator.of(context).pop(out);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.black12, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 14),
          Text(widget.title, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: kFg(context))),
          const SizedBox(height: 14),
          Flexible(
            child: SingleChildScrollView(
              child: Column(children: [
                for (final f in widget.fields) Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: f.type == FieldType.toggle
                      ? Row(children: [
                          Expanded(child: Text(f.label, style: TextStyle(fontSize: 14, color: kFg(context)))),
                          Switch(value: _toggles[f.key] ?? false, onChanged: (v) => setState(() => _toggles[f.key] = v), activeThumbColor: MediWyzColors.teal),
                        ])
                      : TextField(
                          controller: _ctl[f.key],
                          keyboardType: f.type == FieldType.number ? const TextInputType.numberWithOptions(decimal: true) : (f.type == FieldType.multiline ? TextInputType.multiline : TextInputType.text),
                          inputFormatters: f.type == FieldType.number ? [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))] : null,
                          maxLines: f.type == FieldType.multiline ? 3 : 1,
                          decoration: InputDecoration(labelText: f.label + (f.required ? ' *' : ''), isDense: true, border: OutlineInputBorder(borderRadius: BorderRadius.circular(10))),
                        ),
                ),
              ]),
            ),
          ),
          if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12.5))),
          const SizedBox(height: 4),
          SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _submit, style: ElevatedButton.styleFrom(backgroundColor: MediWyzColors.navy, padding: const EdgeInsets.symmetric(vertical: 14)), child: Text(widget.submitLabel, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)))),
          const SizedBox(height: 6),
        ]),
      ),
    );
  }
}
