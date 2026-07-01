import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../config.dart';
import 'agent_api.dart';
import 'page_kit.dart';

const _callProviderTypes = {
  'DOCTOR', 'NURSE', 'NANNY', 'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER',
  'CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST',
};

/// The list of the user's bookings to call from — each row joins the shared
/// `booking-<id>` room so the patient and their booked provider meet. Replaces
/// the old manual "room id" entry; every call now comes from a real booking.
class CallListScreen extends StatelessWidget {
  final bool video;
  final Map<String, dynamic>? user;
  const CallListScreen({super.key, required this.video, required this.user});

  bool get _isProvider => user != null && _callProviderTypes.contains((user!['userType'] ?? '').toString().toUpperCase());

  @override
  Widget build(BuildContext context) {
    return ListPage(
      title: video ? 'Appel vidéo' : 'Appel audio',
      loggedIn: user != null,
      gateText: 'Connectez-vous pour appeler depuis vos rendez-vous.',
      emptyIcon: video ? FontAwesomeIcons.video : FontAwesomeIcons.phone,
      emptyText: 'Aucun rendez-vous à appeler.\nRéservez une consultation pour démarrer un appel.',
      fetch: () => _isProvider ? AgentApi.providerBookings() : AgentApi.patientBookings(),
      tile: (b, _) {
        final other = (_isProvider
                ? (b['patientName'] ?? b['patient']?['name'])
                : (b['providerName'] ?? b['provider']?['name'])) ??
            'Correspondant';
        final when = [
          fmtDate(b['date'] ?? b['appointmentDate'] ?? b['scheduledAt']),
          (b['time'] ?? b['startTime'] ?? '').toString(),
        ].where((s) => s.isNotEmpty).join(' · ');
        final id = b['id']?.toString();
        return ListTile(
          leading: tileIcon(_isProvider ? FontAwesomeIcons.user : FontAwesomeIcons.userDoctor),
          title: Text(other.toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: Text([if (b['serviceType'] != null) b['serviceType'].toString(), when].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
          trailing: ElevatedButton.icon(
            onPressed: id == null ? null : () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => CallScreen(roomId: 'booking-$id', video: video, user: user),
                )),
            icon: FaIcon(video ? FontAwesomeIcons.video : FontAwesomeIcons.phone, size: 13),
            label: const Text('Appeler'),
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), textStyle: const TextStyle(fontSize: 12.5)),
          ),
        );
      },
    );
  }
}

/// 1:1 WebRTC call over the NestJS signaling gateway (join-room → offer/answer/
/// ice). Local + remote video, mute / camera / hang-up controls.
class CallScreen extends StatefulWidget {
  final String roomId;
  final bool video;
  final Map<String, dynamic>? user;
  const CallScreen({super.key, required this.roomId, required this.video, required this.user});
  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  final _local = RTCVideoRenderer();
  final _remote = RTCVideoRenderer();
  io.Socket? _socket;
  RTCPeerConnection? _pc;
  MediaStream? _localStream;
  String? _peerId;
  bool _muted = false, _camOff = false, _remoteOn = false;
  String _status = 'Connexion…';

  static const _config = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'},
    ],
  };

  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    await _local.initialize();
    await _remote.initialize();
    // Permissions (no-op on web; real prompt on device).
    await [Permission.camera, Permission.microphone].request();
    try {
      _localStream = await navigator.mediaDevices.getUserMedia({
        'audio': true,
        'video': widget.video ? {'facingMode': 'user'} : false,
      });
      _local.srcObject = _localStream;
      if (mounted) setState(() {});
    } catch (_) {
      if (mounted) setState(() => _status = "Caméra/micro indisponible ou refusé.");
      return;
    }
    _connectSignaling();
  }

  void _connectSignaling() {
    final s = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .enableForceNew()
          .enableReconnection()
          .setReconnectionAttempts(20)
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(5000)
          .build(),
    );
    _socket = s;
    // Fires on the initial connect AND on every reconnect → always (re)join the
    // room so a dropped socket recovers and peers find each other again.
    s.onConnect((_) {
      if (mounted) setState(() => _status = _remoteOn ? 'Connecté' : 'En attente du correspondant…');
      s.emit('join-room', {
        'roomId': widget.roomId,
        'userId': widget.user?['id']?.toString() ?? 'guest-${DateTime.now().millisecondsSinceEpoch}',
        'userName': widget.user?['firstName']?.toString() ?? 'Invité',
        'userType': widget.user?['userType']?.toString() ?? 'patient',
      });
    });
    // I'm the joiner → I initiate offers to those already here.
    s.on('existing-participants', (data) async {
      final parts = ((data?['participants'] as List?) ?? const []);
      if (parts.isEmpty) return;
      final peer = Map<String, dynamic>.from(parts.first as Map);
      _peerId = peer['socketId']?.toString();
      if (_peerId != null) await _makeOffer(_peerId!);
    });
    s.on('offer', (data) async {
      final from = data?['from']?.toString();
      if (from == null) return;
      _peerId = from;
      await _ensurePc(from);
      final o = data['offer'];
      await _pc!.setRemoteDescription(RTCSessionDescription(o['sdp'], o['type']));
      final answer = await _pc!.createAnswer();
      await _pc!.setLocalDescription(answer);
      s.emit('answer', {'to': from, 'answer': answer.toMap()});
    });
    s.on('answer', (data) async {
      final a = data?['answer'];
      if (a != null && _pc != null) {
        await _pc!.setRemoteDescription(RTCSessionDescription(a['sdp'], a['type']));
      }
    });
    s.on('ice-candidate', (data) async {
      final c = data?['candidate'];
      if (c != null && _pc != null) {
        await _pc!.addCandidate(RTCIceCandidate(c['candidate'], c['sdpMid'], c['sdpMLineIndex']));
      }
    });
    s.on('user-left', (_) { if (mounted) setState(() { _remoteOn = false; _status = 'Le correspondant a quitté.'; }); });
    // On a dropped socket, tear down the stale peer connection so the next
    // (re)connect renegotiates a fresh one instead of reusing a failed pc.
    s.onDisconnect((_) async {
      if (mounted) setState(() { _status = 'Reconnexion…'; _remoteOn = false; });
      try { await _pc?.close(); } catch (_) {}
      _pc = null; _peerId = null;
    });
    s.connect();
  }

  Future<RTCPeerConnection> _ensurePc(String peerId) async {
    if (_pc != null) return _pc!;
    final pc = await createPeerConnection(_config);
    _localStream?.getTracks().forEach((t) => pc.addTrack(t, _localStream!));
    pc.onIceCandidate = (c) {
      if (c.candidate != null) _socket?.emit('ice-candidate', {'to': peerId, 'candidate': c.toMap()});
    };
    pc.onTrack = (e) {
      if (e.streams.isNotEmpty) {
        _remote.srcObject = e.streams.first;
        if (mounted) setState(() { _remoteOn = true; _status = 'Connecté'; });
      }
    };
    pc.onConnectionState = (st) {
      if (st == RTCPeerConnectionState.RTCPeerConnectionStateConnected && mounted) setState(() => _status = 'Connecté');
    };
    _pc = pc;
    return pc;
  }

  Future<void> _makeOffer(String peerId) async {
    final pc = await _ensurePc(peerId);
    final offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    _socket?.emit('offer', {'to': peerId, 'offer': offer.toMap()});
  }

  void _toggleMute() {
    _muted = !_muted;
    _localStream?.getAudioTracks().forEach((t) => t.enabled = !_muted);
    setState(() {});
  }

  void _toggleCam() {
    _camOff = !_camOff;
    _localStream?.getVideoTracks().forEach((t) => t.enabled = !_camOff);
    setState(() {});
  }

  Future<void> _hangup() async {
    await _cleanup();
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _cleanup() async {
    try { _socket?.emit('leave-room', {'roomId': widget.roomId}); } catch (_) {}
    _socket?.dispose();
    _localStream?.getTracks().forEach((t) => t.stop());
    await _pc?.close();
    await _local.dispose();
    await _remote.dispose();
  }

  @override
  void dispose() {
    _cleanup();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF02132a),
      body: Stack(children: [
        // Remote (full screen) or status
        Positioned.fill(
          child: _remoteOn
              ? RTCVideoView(_remote, objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover)
              : Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const CircularProgressIndicator(color: Colors.white24),
                  const SizedBox(height: 14),
                  Text(_status, style: const TextStyle(color: Colors.white70)),
                  const SizedBox(height: 4),
                  Text('Salle : ${widget.roomId}', style: const TextStyle(color: Colors.white38, fontSize: 12)),
                ])),
        ),
        // Local preview (PiP)
        if (widget.video)
          Positioned(
            top: 50, right: 16, width: 110, height: 150,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Container(color: Colors.black, child: RTCVideoView(_local, mirror: true, objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover)),
            ),
          ),
        // Controls
        Positioned(
          left: 0, right: 0, bottom: 36,
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            _ctrl(_muted ? Icons.mic_off : Icons.mic, _muted ? Colors.red : Colors.white24, _toggleMute),
            const SizedBox(width: 18),
            _ctrl(Icons.call_end, Colors.red, _hangup, big: true),
            const SizedBox(width: 18),
            if (widget.video) _ctrl(_camOff ? Icons.videocam_off : Icons.videocam, _camOff ? Colors.red : Colors.white24, _toggleCam),
          ]),
        ),
      ]),
    );
  }

  Widget _ctrl(IconData icon, Color bg, VoidCallback onTap, {bool big = false}) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: big ? 64 : 54, height: big ? 64 : 54,
          decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
          child: Icon(icon, color: Colors.white, size: big ? 30 : 24),
        ),
      );
}
