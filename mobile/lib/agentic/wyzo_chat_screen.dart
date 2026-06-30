import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';

/// The whole app: a single agentic chat over the deployed NestJS backend.
/// Animated hero (logo + cross-fading background) on top, conversation below.
class WyzoChatScreen extends StatefulWidget {
  const WyzoChatScreen({super.key});
  @override
  State<WyzoChatScreen> createState() => _WyzoChatScreenState();
}

const _heroImages = [
  'assets/images/medical_team.jpg',
  'assets/images/telemedicine.jpg',
  'assets/images/hospital.jpg',
  'assets/images/paramedics.jpg',
];
const _suggestions = [
  'Une infirmière à domicile',
  'Un médecin en consultation vidéo',
  'Suggère un plan de repas santé',
  'Commander un médicament',
];

String _fmtKm(num km) => km < 1 ? '${(km * 1000).round()} m' : '${km.toStringAsFixed(1)} km';

class _Day {
  final String date, label;
  final List<String> slots;
  _Day(this.date, this.label, this.slots);
}

class _Msg {
  final String role; // bot | user
  String? text;
  bool typing;
  List<dynamic> providers, organisations, products;
  List<String> followUps;
  List<_Day> days;
  List<Map<String, dynamic>> services;
  Map<String, dynamic>? confirm;
  List<dynamic> list;
  bool booked;
  _Msg(this.role, {this.text, this.typing = false, this.providers = const [], this.organisations = const [], this.products = const [], this.followUps = const [], this.days = const [], this.services = const [], this.confirm, this.list = const [], this.booked = false});
}

class _WyzoChatScreenState extends State<WyzoChatScreen> with SingleTickerProviderStateMixin {
  final _messages = <_Msg>[];
  final _input = TextEditingController();
  final _scroll = ScrollController();
  bool _loading = false;

  // hero animation
  int _bg = 0;
  Timer? _bgTimer;
  late final AnimationController _kenBurns;

  // auth state (for the indicator)
  Map<String, dynamic>? _user;

  // booking state
  Map<String, dynamic>? _provider, _service;
  String? _date, _time, _stage; // stage: slot | service | confirm
  List<String> _lastProviderIds = [];

  // cached device location for "near me" searches (asked for lazily, once)
  ({double lat, double lng})? _geo;

  @override
  void initState() {
    super.initState();
    _kenBurns = AnimationController(vsync: this, duration: const Duration(seconds: 7))..repeat(reverse: true);
    _bgTimer = Timer.periodic(const Duration(seconds: 6), (_) => setState(() => _bg = (_bg + 1) % _heroImages.length));
    AgentApi.me().then((u) { if (mounted) setState(() => _user = u); });
  }

  void _authTap() {
    if (_user == null) { _send('Comment créer un compte ?'); return; }
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: const Icon(Icons.person, color: MediWyzColors.teal),
            title: Text('Connecté : ${_user!['firstName'] ?? ''}'),
          ),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Se déconnecter (tester en invité)'),
            onTap: () async {
              Navigator.of(context).pop();
              await AgentApi.logout();
              if (mounted) setState(() => _user = null);
            },
          ),
        ]),
      ),
    );
  }

  @override
  void dispose() {
    _bgTimer?.cancel();
    _kenBurns.dispose();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    });
  }

  static final _nearbyRe = RegExp(
    r'near ?(me|by)|nearest|closest|around me|près de (moi|chez)|le plus proche|à proximité|autour de moi',
    caseSensitive: false,
  );

  /// Lazily obtain the device location — only when a message implies proximity.
  /// Cached after the first grant; returns null if disabled/denied (the agent
  /// then falls back to a normal search, exactly like the web client).
  Future<({double lat, double lng})?> _ensureGeo() async {
    if (_geo != null) return _geo;
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return null;
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) return null;
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, timeLimit: Duration(seconds: 8)),
      );
      _geo = (lat: pos.latitude, lng: pos.longitude);
      return _geo;
    } catch (_) {
      return null;
    }
  }

  Future<void> _send(String raw) async {
    final q = raw.trim();
    if (q.isEmpty || _loading) return;
    _input.clear();

    // confirm step interception
    if (_stage == 'confirm') {
      final l = q.toLowerCase();
      if (RegExp(r'\b(no|non|cancel|annule)').hasMatch(l)) {
        setState(() { _stage = null; _messages.add(_Msg('user', text: q)); _messages.add(_Msg('bot', text: 'Pas de souci — réservation annulée. Autre chose ?')); });
        _scrollToEnd();
        return;
      }
      if (RegExp(r'\b(yes|oui|confirm|ok|valide|go)').hasMatch(l)) {
        setState(() => _messages.add(_Msg('user', text: q)));
        _confirmBooking();
        return;
      }
    }

    setState(() {
      _stage = null;
      _messages.add(_Msg('user', text: q));
      _messages.add(_Msg('bot', typing: true));
      _loading = true;
    });
    _scrollToEnd();

    try {
      final history = _messages.where((m) => m.text != null && !m.typing).map((m) => {'role': m.role, 'text': m.text!}).toList();
      // Only ask the device for location when the message implies proximity.
      final geo = _nearbyRe.hasMatch(q) ? await _ensureGeo() : _geo;
      final d = await AgentApi.chat(
        q,
        history: history.length > 6 ? history.sublist(history.length - 6) : history,
        lastProviderIds: _lastProviderIds,
        lat: geo?.lat,
        lng: geo?.lng,
      );
      final providers = (d['providers'] as List?) ?? const [];
      if (providers.isNotEmpty) _lastProviderIds = providers.map((p) => (p as Map)['id'].toString()).toList();
      _replaceTyping(_Msg('bot',
        text: (d['reply'] as String?) ?? '…',
        providers: providers,
        organisations: (d['organisations'] as List?) ?? const [],
        products: (d['products'] as List?) ?? const [],
        list: ((d['list'] as Map?)?['items'] as List?) ?? const [],
        followUps: ((d['followUps'] as List?) ?? const []).map((e) => e.toString()).toList(),
      ));
      if (d['action'] == 'book' && d['bookProviderId'] != null) {
        final p = providers.cast<Map>().firstWhere((x) => x['id'] == d['bookProviderId'], orElse: () => {});
        if (p.isNotEmpty) _startBooking(Map<String, dynamic>.from(p));
      }
      if (d['action'] == 'topup') {
        final preset = (d['topupAmount'] is num) ? (d['topupAmount'] as num).toInt() : null;
        if (_user == null) {
          _openSignup(() => _startTopUp(preset));
        } else {
          _startTopUp(preset);
        }
      }
    } catch (_) {
      _replaceTyping(_Msg('bot', text: 'Problème de connexion — réessayez dans un instant.'));
    } finally {
      setState(() => _loading = false);
    }
  }

  void _replaceTyping(_Msg m) {
    setState(() {
      final i = _messages.lastIndexWhere((x) => x.typing);
      if (i >= 0) {
        _messages[i] = m;
      } else {
        _messages.add(m);
      }
    });
    _scrollToEnd();
  }

  Future<void> _startBooking(Map<String, dynamic> provider) async {
    setState(() {
      _provider = provider; _stage = 'slot';
      _messages.add(_Msg('user', text: 'Réserver ${provider['name']}'));
      _messages.add(_Msg('bot', typing: true));
    });
    _scrollToEnd();
    try {
      final days = <_Day>[];
      final now = DateTime.now();
      for (var i = 0; i < 7; i++) {
        final dt = now.add(Duration(days: i));
        final date = '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
        final slots = await AgentApi.availableSlots(provider['id'].toString(), date);
        if (slots.isNotEmpty) {
          const wd = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
          days.add(_Day(date, '${wd[dt.weekday - 1]} ${dt.day}/${dt.month}', slots.take(8).toList()));
        }
      }
      _replaceTyping(days.isNotEmpty
          ? _Msg('bot', text: "Voici les disponibilités de ${provider['name']} — choisissez un créneau :", days: days)
          : _Msg('bot', text: "${provider['name']} n'a pas de créneau libre cette semaine. Essayez un autre prestataire."));
      if (days.isEmpty) _stage = null;
    } catch (_) {
      _replaceTyping(_Msg('bot', text: 'Impossible de charger les disponibilités.'));
      _stage = null;
    }
  }

  Future<void> _pickSlot(String date, String time, String label) async {
    if (_reschedule != null) {
      final r = _reschedule!;
      _reschedule = null; _stage = null;
      setState(() { _messages.add(_Msg('user', text: '$label · $time')); _messages.add(_Msg('bot', typing: true)); });
      _scrollToEnd();
      try {
        final j = await AgentApi.rescheduleBooking(r['bookingId']!, r['bookingType']!, date, time);
        _replaceTyping(_Msg('bot', text: (j['success'] == true || j['booking'] != null || j['message'] != null) ? '✅ Rendez-vous reporté au $date à $time.' : 'Impossible de reporter — réessayez.'));
      } catch (_) {
        _replaceTyping(_Msg('bot', text: 'Impossible de reporter — réessayez.'));
      }
      return;
    }
    setState(() {
      _date = date; _time = time;
      _messages.add(_Msg('user', text: '$label à $time'));
      _messages.add(_Msg('bot', typing: true));
    });
    _scrollToEnd();
    try {
      final services = await AgentApi.providerServices(_provider!['id'].toString());
      if (services.isNotEmpty) {
        _stage = 'service';
        _replaceTyping(_Msg('bot', text: 'Quel service souhaitez-vous réserver ?', services: services.take(6).toList()));
      } else {
        _stage = 'confirm';
        _replaceTyping(_Msg('bot', text: "Pas de service précis — je réserve une consultation standard.", confirm: {'provider': _provider, 'date': date, 'time': time}));
      }
    } catch (_) {
      _replaceTyping(_Msg('bot', text: 'Impossible de charger les services.'));
    }
  }

  void _pickService(Map<String, dynamic> svc) {
    setState(() {
      _service = svc; _stage = 'confirm';
      _messages.add(_Msg('user', text: svc['serviceName']?.toString() ?? 'Service'));
      final price = svc['price'];
      _messages.add(_Msg('bot',
        text: "Confirmer : ${svc['serviceName']}${price != null ? ' · Rs $price' : ''} avec ${_provider!['name']} le $_date à $_time ? (oui/non)",
        confirm: {'provider': _provider, 'date': _date, 'time': _time, 'service': svc}));
    });
    _scrollToEnd();
  }

  Future<void> _confirmBooking() async {
    setState(() => _stage = null);
    await _submitBooking();
  }

  Future<void> _submitBooking() async {
    setState(() { _messages.add(_Msg('bot', typing: true)); _loading = true; });
    _scrollToEnd();
    try {
      final wf = (_service?['workflows'] as List?)?.isNotEmpty == true ? (_service!['workflows'] as List).first as Map : null;
      final j = await AgentApi.createBooking({
        'providerUserId': _provider!['id'],
        'providerType': _provider!['userType'],
        'scheduledDate': _date,
        'scheduledTime': _time,
        'platformServiceId': _service?['id'],
        'serviceName': _service?['serviceName'],
        'duration': _service?['duration'] ?? 30,
        'type': wf?['serviceMode'] ?? 'in_person',
        'reason': _service?['serviceName'],
      });
      if (j['success'] == true || j['booking'] != null) {
        _replaceTyping(_Msg('bot', text: '✅ Réservé ! Votre rendez-vous avec ${_provider!['name']} est le $_date à $_time. Vous paierez sur place.', booked: true));
      } else {
        // Guest (not signed in) → collect details and create the account in-chat,
        // then resume the booking automatically.
        _replaceTyping(_Msg('bot', text: 'Encore une étape : créez un compte gratuit (30 s) pour confirmer. Vous paierez sur place.'));
        _openSignup(_submitBooking);
      }
    } catch (_) {
      _replaceTyping(_Msg('bot', text: 'Échec de la réservation — réessayez.'));
    } finally {
      setState(() => _loading = false);
    }
  }

  void _openSignup(VoidCallback onDone) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _SignupSheet(onSuccess: () {
        Navigator.of(context).pop();
        onDone();
      }),
    );
  }

  // ── Health Shop purchase ──────────────────────────────────────────────────
  void _startPurchase(Map<String, dynamic> product) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _PurchaseSheet(product: product, onConfirm: (order) {
        Navigator.of(context).pop();
        _placeOrder(product, order);
      }),
    );
  }

  Future<void> _placeOrder(Map<String, dynamic> product, Map<String, dynamic> order) async {
    setState(() { _messages.add(_Msg('bot', typing: true)); _loading = true; });
    _scrollToEnd();
    try {
      final j = await AgentApi.createOrder({
        'providerUserId': product['providerUserId'],
        'items': [{'itemId': product['id'], 'quantity': order['qty']}],
        'deliveryMethod': order['fulfil'],
        if (order['fulfil'] == 'delivery') 'deliveryAddress': order['address'],
      });
      if (j['success'] == true || j['data'] != null) {
        final how = order['fulfil'] == 'delivery' ? 'livré à ${order['address']}' : 'à récupérer chez le vendeur';
        _replaceTyping(_Msg('bot', text: '✅ Commande passée ! ${order['qty']} × ${product['name']} — $how. Paiement à la ${order['fulfil'] == 'delivery' ? 'livraison' : 'récupération'}.', booked: true));
      } else {
        _replaceTyping(_Msg('bot', text: 'Encore une étape : créez un compte gratuit (30 s) pour commander.'));
        _openSignup(() => _placeOrder(product, order));
      }
    } catch (_) {
      _replaceTyping(_Msg('bot', text: 'Échec de la commande — réessayez.'));
    } finally {
      setState(() => _loading = false);
    }
  }

  // ── Wallet top-up ─────────────────────────────────────────────────────────
  void _startTopUp(int? preset) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _TopUpSheet(preset: preset, onConfirm: (amount) {
        Navigator.of(context).pop();
        _topUp(amount);
      }),
    );
  }

  Future<void> _topUp(int amount) async {
    final uid = _user?['id']?.toString();
    if (uid == null || amount <= 0) return;
    setState(() {
      _messages.add(_Msg('user', text: 'Recharger Rs $amount'));
      _messages.add(_Msg('bot', typing: true));
      _loading = true;
    });
    _scrollToEnd();
    try {
      final j = await AgentApi.topUpWallet(uid, amount);
      final data = j['data'] as Map?;
      final bal = data?['balance'] ?? (data?['wallet'] as Map?)?['balance'];
      if (j['success'] == true || data != null) {
        _replaceTyping(_Msg('bot', text: '✅ Rs $amount ajoutés.${bal != null ? ' Nouveau solde : Rs $bal.' : ''}', booked: true));
      } else {
        _replaceTyping(_Msg('bot', text: 'Recharge impossible — réessayez.'));
      }
    } catch (_) {
      _replaceTyping(_Msg('bot', text: 'Recharge impossible — réessayez.'));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF02132a),
      body: Stack(
        fit: StackFit.expand,
        children: [
          _background(),
          SafeArea(
            child: Column(
              children: [
                _heroText(),
                Expanded(
                  child: _messages.isEmpty
                      ? _chips()
                      : ListView.builder(
                          controller: _scroll,
                          padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
                          itemCount: _messages.length,
                          itemBuilder: (_, i) => _bubble(_messages[i]),
                        ),
                ),
                _inputBar(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Full-screen animated background (cross-fade + Ken-Burns) behind the WHOLE
  // chat UI, with a scrim that keeps the conversation readable.
  Widget _background() {
    return Stack(fit: StackFit.expand, children: [
      AnimatedSwitcher(
        duration: const Duration(milliseconds: 900),
        child: AnimatedBuilder(
          key: ValueKey(_bg),
          animation: _kenBurns,
          builder: (_, child) => Transform.scale(scale: 1.0 + _kenBurns.value * 0.12, child: child),
          child: Image.asset(_heroImages[_bg], fit: BoxFit.cover),
        ),
      ),
      Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xF0001024), Color(0xC0021A30), Color(0xE6010F22)],
            stops: [0.0, 0.45, 1.0],
          ),
        ),
      ),
    ]);
  }

  Widget _heroText() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          ClipRRect(borderRadius: BorderRadius.circular(9), child: Image.asset('assets/images/logo-icon.png', width: 34, height: 34)),
          const SizedBox(width: 10),
          const Text('MediWyz', style: TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w800)),
          const Spacer(),
          GestureDetector(
            onTap: _authTap,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(_user != null ? Icons.person : Icons.person_outline, color: Colors.white70, size: 12),
                const SizedBox(width: 4),
                Text(_user != null ? (_user!['firstName']?.toString() ?? 'Compte') : 'Invité', style: const TextStyle(color: Colors.white70, fontSize: 10)),
              ]),
            ),
          ),
        ]),
        const SizedBox(height: 8),
        const Text('La santé, réinventée', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, shadows: [Shadow(color: Colors.black54, blurRadius: 8)])),
        const SizedBox(height: 3),
        const Row(children: [
          Icon(Icons.auto_awesome, color: MediWyzColors.sky, size: 13),
          SizedBox(width: 6),
          Expanded(child: Text("Bienvenue dans l'ère Agentique — discutez avec notre IA santé", style: TextStyle(color: MediWyzColors.sky, fontSize: 11.5, fontWeight: FontWeight.w600))),
        ]),
      ]),
    );
  }

  Widget _chips() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
        const SizedBox(height: 8),
        const Text('Que puis-je faire pour vous ?', style: TextStyle(color: Colors.white70, fontSize: 13)),
        const SizedBox(height: 12),
        Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: _suggestions.map((s) => _chip(s)).toList()),
      ]),
    );
  }

  Widget _chip(String label) => InkWell(
        onTap: _loading ? null : () => _send(label),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white24)),
          child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 13)),
        ),
      );

  Widget _bubble(_Msg m) {
    final isUser = m.role == 'user';
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.86),
        margin: const EdgeInsets.symmetric(vertical: 4),
        child: Column(crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start, children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(
              color: isUser ? MediWyzColors.teal : Colors.white.withValues(alpha: 0.10),
              border: isUser ? null : Border.all(color: Colors.white24),
              borderRadius: BorderRadius.circular(14),
            ),
            child: m.typing
                ? const SizedBox(width: 36, child: Text('…', style: TextStyle(color: Colors.white70, fontSize: 18)))
                : Text(m.text ?? '', style: const TextStyle(color: Colors.white, fontSize: 14)),
          ),
          ...m.providers.map((p) => _providerCard(Map<String, dynamic>.from(p as Map))),
          ...m.organisations.map((o) => _simpleCard(Icons.business, (o as Map)['name']?.toString() ?? '', '${o['type'] ?? 'organisation'}${o['city'] != null ? ' · ${o['city']}' : ''}${o['distanceKm'] is num ? ' · ${_fmtKm(o['distanceKm'] as num)}' : ''}')),
          ...m.products.map((p) => _buyableProduct(Map<String, dynamic>.from(p as Map))),
          ...m.list.map((it) => _listTile(Map<String, dynamic>.from(it as Map))),
          if (m.days.isNotEmpty) _slots(m.days),
          if (m.services.isNotEmpty) ...m.services.map((s) => _serviceTile(s)),
          if (m.confirm != null) Padding(padding: const EdgeInsets.only(top: 6), child: ElevatedButton.icon(onPressed: _confirmBooking, icon: const Icon(Icons.event_available, size: 16), label: const Text('Confirmer'))),
          if (m.followUps.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Wrap(spacing: 6, runSpacing: 6, children: m.followUps.map((f) => _chip(f)).toList())),
        ]),
      ),
    );
  }

  Widget _providerCard(Map<String, dynamic> r) {
    final name = r['name']?.toString() ?? '';
    final initials = name.split(' ').where((w) => w.isNotEmpty).map((w) => w[0]).take(2).join().toUpperCase();
    return Container(
      margin: const EdgeInsets.only(top: 6),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        CircleAvatar(radius: 16, backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12), child: Text(initials, style: const TextStyle(color: MediWyzColors.teal, fontSize: 11, fontWeight: FontWeight.bold))),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          Text('${(r['userType'] ?? '').toString().toLowerCase().replaceAll('_', ' ')}${r['address'] != null ? ' · ${r['address']}' : ''}${r['distanceKm'] is num ? ' · ${_fmtKm(r['distanceKm'] as num)}' : ''}', style: const TextStyle(fontSize: 10, color: Colors.black54), maxLines: 1, overflow: TextOverflow.ellipsis),
        ])),
        TextButton(onPressed: () => _startBooking(r), child: const Text('Réserver')),
      ]),
    );
  }

  Widget _simpleCard(IconData icon, String title, String sub) => Container(
        margin: const EdgeInsets.only(top: 6),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          Icon(icon, color: MediWyzColors.teal, size: 18),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            if (sub.isNotEmpty) Text(sub, style: const TextStyle(fontSize: 10, color: Colors.black54)),
          ])),
        ]),
      );

  Widget _buyableProduct(Map<String, dynamic> p) {
    final outOfStock = p['inStock'] == false;
    return Container(
      margin: const EdgeInsets.only(top: 6),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        const Icon(Icons.medication, color: MediWyzColors.teal, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(p['name']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          Text('${p['category'] ?? 'product'}${p['requiresPrescription'] == true ? ' · ordonnance' : ''}${outOfStock ? ' · rupture' : ''}', style: const TextStyle(fontSize: 10, color: Colors.black54)),
        ])),
        if (p['price'] != null) Padding(padding: const EdgeInsets.only(right: 4), child: Text('${p['currency'] ?? 'Rs'} ${p['price']}', style: const TextStyle(color: MediWyzColors.teal, fontWeight: FontWeight.bold, fontSize: 12))),
        TextButton(onPressed: outOfStock ? null : () => _startPurchase(p), child: const Text('Acheter')),
      ]),
    );
  }

  Widget _listTile(Map<String, dynamic> it) => Container(
        margin: const EdgeInsets.only(top: 6),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(it['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            if (it['subtitle'] != null) Text(it['subtitle'].toString(), style: const TextStyle(fontSize: 10, color: Colors.black54)),
          ])),
          if (it['badge'] != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: MediWyzColors.teal.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
              child: Text(it['badge'].toString(), style: const TextStyle(fontSize: 10, color: MediWyzColors.teal, fontWeight: FontWeight.w600)),
            ),
          ...(((it['actions'] as List?) ?? const []).map((a) {
            final am = Map<String, dynamic>.from(a as Map);
            final isCancel = am['kind'] == 'cancel_booking';
            return TextButton(
              onPressed: _loading ? null : () => _runListAction(am),
              style: TextButton.styleFrom(foregroundColor: isCancel ? Colors.red : MediWyzColors.teal, minimumSize: const Size(0, 32), padding: const EdgeInsets.symmetric(horizontal: 8)),
              child: Text(am['label']?.toString() ?? 'Action', style: const TextStyle(fontSize: 11)),
            );
          })),
        ]),
      );

  Map<String, String>? _reschedule;

  Future<void> _runListAction(Map<String, dynamic> a) async {
    if (a['kind'] == 'reschedule_booking') {
      final p = a['payload'] as Map?;
      _reschedule = { 'bookingId': a['id'].toString(), 'bookingType': (p?['bookingType'] ?? 'service').toString() };
      _startBooking({'id': (p?['providerUserId'] ?? '').toString(), 'name': (p?['providerName'] ?? '').toString(), 'userType': ''});
      return;
    }
    if (a['kind'] == 'cancel_booking') {
      setState(() { _messages.add(_Msg('bot', typing: true)); _loading = true; });
      _scrollToEnd();
      try {
        final payload = a['payload'] as Map?;
        final j = await AgentApi.cancelBooking(a['id'].toString(), (payload?['bookingType'] ?? 'service').toString());
        _replaceTyping(_Msg('bot', text: (j['success'] == true || j['message'] != null) ? '✅ Rendez-vous annulé.' : 'Annulation impossible — réessayez.'));
      } catch (_) {
        _replaceTyping(_Msg('bot', text: 'Annulation impossible — réessayez.'));
      } finally {
        setState(() => _loading = false);
      }
    }
  }

  Widget _slots(List<_Day> days) => Container(
        margin: const EdgeInsets.only(top: 6),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: days.map((d) => Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(d.label, style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Wrap(spacing: 6, runSpacing: 6, children: d.slots.map((t) => InkWell(
              onTap: () => _pickSlot(d.date, t, d.label),
              child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5), decoration: BoxDecoration(border: Border.all(color: MediWyzColors.sky), borderRadius: BorderRadius.circular(8)), child: Text(t, style: const TextStyle(color: Colors.white, fontSize: 12))),
            )).toList()),
          ]),
        )).toList()),
      );

  Widget _serviceTile(Map<String, dynamic> svc) => InkWell(
        onTap: () => _pickService(svc),
        child: Container(
          margin: const EdgeInsets.only(top: 6),
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(svc['serviceName']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              Text('${svc['duration'] ?? 30} min', style: const TextStyle(fontSize: 10, color: Colors.black54)),
            ])),
            Text(svc['price'] != null ? 'Rs ${svc['price']}' : 'Gratuit', style: const TextStyle(color: MediWyzColors.teal, fontWeight: FontWeight.bold, fontSize: 12)),
          ]),
        ),
      );

  Widget _inputBar() => Container(
        padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
        child: Row(children: [
          Expanded(child: TextField(
            controller: _input,
            onSubmitted: _send,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Posez votre question ou décrivez votre besoin…',
              hintStyle: const TextStyle(color: Colors.white54),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.10),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            ),
          )),
          const SizedBox(width: 8),
          CircleAvatar(
            backgroundColor: MediWyzColors.sky,
            child: IconButton(
              icon: _loading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF001225))) : const Icon(Icons.send, color: Color(0xFF001225)),
              onPressed: _loading ? null : () => _send(_input.text),
            ),
          ),
        ]),
      );
}

/// In-chat patient signup. Collects the fields POST /auth/register requires;
/// the backend auto-logs-in active patient accounts, so on success the caller
/// resumes the pending booking.
class _SignupSheet extends StatefulWidget {
  final VoidCallback onSuccess;
  const _SignupSheet({required this.onSuccess});
  @override
  State<_SignupSheet> createState() => _SignupSheetState();
}

class _SignupSheetState extends State<_SignupSheet> {
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  final _password = TextEditingController();
  String _dob = '';
  String _gender = '';
  bool _busy = false;
  String? _err;

  @override
  void dispose() {
    _fullName.dispose(); _email.dispose(); _phone.dispose(); _address.dispose(); _password.dispose();
    super.dispose();
  }

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final d = await showDatePicker(context: context, initialDate: DateTime(now.year - 25), firstDate: DateTime(1920), lastDate: now);
    if (d != null) setState(() => _dob = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}');
  }

  Future<void> _submit() async {
    setState(() => _err = null);
    if (_fullName.text.trim().isEmpty || _email.text.trim().isEmpty || _phone.text.trim().isEmpty || _dob.isEmpty || _gender.isEmpty || _address.text.trim().isEmpty) {
      setState(() => _err = 'Veuillez remplir tous les champs.');
      return;
    }
    if (_password.text.length < 6) { setState(() => _err = 'Mot de passe : au moins 6 caractères.'); return; }
    setState(() => _busy = true);
    try {
      final j = await AgentApi.register({
        'fullName': _fullName.text.trim(), 'email': _email.text.trim(), 'phone': _phone.text.trim(),
        'dateOfBirth': _dob, 'gender': _gender, 'address': _address.text.trim(), 'password': _password.text,
      });
      if (j['success'] == true) {
        widget.onSuccess();
      } else {
        setState(() => _err = (j['message'] ?? 'Création impossible. Réessayez.').toString());
      }
    } catch (_) {
      setState(() => _err = 'Erreur réseau — réessayez.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
        padding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Créer votre compte gratuit', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: MediWyzColors.navy)),
            const SizedBox(height: 4),
            const Text('Quelques infos et je confirme votre réservation. Paiement sur place.', style: TextStyle(fontSize: 12, color: Colors.black54)),
            const SizedBox(height: 12),
            _tf(_fullName, 'Nom complet'),
            _tf(_email, 'Email', keyboard: TextInputType.emailAddress),
            _tf(_phone, 'Téléphone', keyboard: TextInputType.phone),
            Row(children: [
              Expanded(child: OutlinedButton(onPressed: _pickDob, child: Text(_dob.isEmpty ? 'Naissance' : _dob, overflow: TextOverflow.ellipsis))),
              const SizedBox(width: 8),
              Expanded(child: DropdownButtonFormField<String>(
                initialValue: _gender.isEmpty ? null : _gender,
                isDense: true,
                hint: const Text('Genre'),
                items: const [
                  DropdownMenuItem(value: 'male', child: Text('Homme')),
                  DropdownMenuItem(value: 'female', child: Text('Femme')),
                  DropdownMenuItem(value: 'other', child: Text('Autre')),
                ],
                onChanged: (v) => setState(() => _gender = v ?? ''),
              )),
            ]),
            const SizedBox(height: 8),
            _tf(_address, 'Adresse'),
            _tf(_password, 'Mot de passe (min. 6)', obscure: true),
            if (_err != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(_err!, style: const TextStyle(color: Colors.red, fontSize: 12))),
            const SizedBox(height: 12),
            SizedBox(width: double.infinity, child: ElevatedButton(
              onPressed: _busy ? null : _submit,
              child: _busy ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Créer le compte & confirmer'),
            )),
            const SizedBox(height: 6),
          ]),
        ),
      ),
    );
  }

  Widget _tf(TextEditingController c, String hint, {bool obscure = false, TextInputType? keyboard}) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: TextField(controller: c, obscureText: obscure, keyboardType: keyboard, decoration: InputDecoration(hintText: hint, isDense: true)),
      );
}

/// Health Shop purchase sheet: quantity + delivery/pickup (+ address). The
/// parent handles the login gate and the order POST (pay-on-delivery).
class _PurchaseSheet extends StatefulWidget {
  final Map<String, dynamic> product;
  final void Function(Map<String, dynamic> order) onConfirm;
  const _PurchaseSheet({required this.product, required this.onConfirm});
  @override
  State<_PurchaseSheet> createState() => _PurchaseSheetState();
}

class _PurchaseSheetState extends State<_PurchaseSheet> {
  int _qty = 1;
  String _fulfil = 'pickup';
  final _address = TextEditingController();

  @override
  void dispose() { _address.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final price = (p['price'] is num) ? (p['price'] as num).toDouble() : 0.0;
    final cur = p['currency'] ?? 'Rs';
    final needsAddress = _fulfil == 'delivery' && _address.text.trim().isEmpty;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
        padding: const EdgeInsets.all(16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(p['name']?.toString() ?? '', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: MediWyzColors.navy))),
            Text('$cur ${price.toStringAsFixed(0)}', style: const TextStyle(color: MediWyzColors.teal, fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            const Text('Quantité', style: TextStyle(fontSize: 13)),
            const Spacer(),
            IconButton(onPressed: () => setState(() => _qty = _qty > 1 ? _qty - 1 : 1), icon: const Icon(Icons.remove_circle_outline)),
            Text('$_qty', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            IconButton(onPressed: () => setState(() => _qty++), icon: const Icon(Icons.add_circle_outline)),
          ]),
          Text('Total : $cur ${(price * _qty).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Row(children: [
            for (final f in const ['pickup', 'delivery'])
              Expanded(child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: OutlinedButton(
                  onPressed: () => setState(() => _fulfil = f),
                  style: OutlinedButton.styleFrom(backgroundColor: _fulfil == f ? MediWyzColors.teal : null, foregroundColor: _fulfil == f ? Colors.white : MediWyzColors.teal),
                  child: Text(f == 'pickup' ? 'Retrait' : 'Livraison'),
                ),
              )),
          ]),
          const SizedBox(height: 8),
          if (_fulfil == 'delivery')
            TextField(controller: _address, onChanged: (_) => setState(() {}), decoration: const InputDecoration(hintText: 'Adresse de livraison', isDense: true))
          else
            const Text('À récupérer chez le vendeur.', style: TextStyle(fontSize: 12, color: Colors.black54)),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(
            onPressed: needsAddress ? null : () => widget.onConfirm({'qty': _qty, 'fulfil': _fulfil, 'address': _address.text.trim()}),
            icon: const Icon(Icons.shopping_cart, size: 16),
            label: Text('Commander — paiement à la ${_fulfil == 'delivery' ? 'livraison' : 'récupération'}'),
          )),
          const SizedBox(height: 6),
        ]),
      ),
    );
  }
}

class _TopUpSheet extends StatefulWidget {
  final int? preset;
  final void Function(int amount) onConfirm;
  const _TopUpSheet({required this.preset, required this.onConfirm});
  @override
  State<_TopUpSheet> createState() => _TopUpSheetState();
}

class _TopUpSheetState extends State<_TopUpSheet> {
  late int _amount = (widget.preset != null && widget.preset! > 0) ? widget.preset! : 500;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
        padding: const EdgeInsets.all(16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Recharger le portefeuille', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: MediWyzColors.navy)),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (final a in const [500, 1000, 2000, 5000])
              OutlinedButton(
                onPressed: () => setState(() => _amount = a),
                style: OutlinedButton.styleFrom(backgroundColor: _amount == a ? MediWyzColors.teal : null, foregroundColor: _amount == a ? Colors.white : MediWyzColors.teal),
                child: Text('Rs $a'),
              ),
          ]),
          const SizedBox(height: 12),
          Text('Montant : Rs $_amount', style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: _amount > 0 ? () => widget.onConfirm(_amount) : null,
            child: Text('Ajouter Rs $_amount'),
          )),
          const SizedBox(height: 6),
        ]),
      ),
    );
  }
}
