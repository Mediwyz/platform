import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config.dart';
import '../theme/mediwyz_theme.dart';

/// Room entry for a video/audio call — pick/confirm a room id and join.
/// (In the agentic flow a room id would come from a booking; for now the user
/// enters or accepts a shared id so two peers can meet — tested via two Chrome
/// tabs or the web app's call page on the same room.)
class CallEntryScreen extends StatefulWidget {
  final bool video;
  final Map<String, dynamic>? user;
  const CallEntryScreen({super.key, required this.video, required this.user});
  @override
  State<CallEntryScreen> createState() => _CallEntryScreenState();
}

class _CallEntryScreenState extends State<CallEntryScreen> {
  final _room = TextEditingController(text: 'mediwyz-demo');

  @override
  void dispose() { _room.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.video ? 'Appel vidéo' : 'Appel audio')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            const SizedBox(height: 12),
            Icon(widget.video ? Icons.videocam : Icons.call, size: 56, color: MediWyzColors.teal),
            const SizedBox(height: 12),
            const Text('Rejoindre une salle', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: MediWyzColors.navy)),
            const SizedBox(height: 4),
            const Text("Partagez le même identifiant de salle avec l'autre participant.", textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: Colors.black54)),
            const SizedBox(height: 20),
            TextField(controller: _room, decoration: const InputDecoration(labelText: 'Identifiant de la salle', isDense: true)),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  final room = _room.text.trim();
                  if (room.isEmpty) return;
                  Navigator.of(context).pushReplacement(MaterialPageRoute(
                    builder: (_) => CallScreen(roomId: room, video: widget.video, user: widget.user),
                  ));
                },
                icon: Icon(widget.video ? Icons.videocam : Icons.call, size: 18),
                label: const Text('Rejoindre'),
              ),
            ),
          ]),
        ),
      ),
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
