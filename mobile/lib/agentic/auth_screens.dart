import 'package:flutter/material.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';

/// Shared brand header (logo + title) for the auth pages.
Widget _authHeader(String title, String subtitle) => Column(children: [
      ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.asset('assets/images/logo-icon.png', width: 56, height: 56)),
      const SizedBox(height: 12),
      Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: MediWyzColors.navy)),
      const SizedBox(height: 4),
      Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Colors.black54)),
    ]);

InputDecoration _dec(String label, {Widget? suffix}) =>
    InputDecoration(labelText: label, isDense: true, suffixIcon: suffix);

/// Email + password sign-in. Pops `true` on success so the caller refreshes auth.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false, _obscure = true;
  String? _err;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _err = null);
    if (_email.text.trim().isEmpty || _password.text.isEmpty) {
      setState(() => _err = 'Entrez votre email et mot de passe.');
      return;
    }
    setState(() => _busy = true);
    try {
      final j = await AgentApi.login(_email.text.trim(), _password.text);
      if (j['success'] == true || j['user'] != null || j['accessToken'] != null) {
        if (mounted) Navigator.of(context).pop(true);
      } else {
        setState(() => _err = (j['message'] ?? 'Identifiants invalides.').toString());
      }
    } catch (_) {
      setState(() => _err = 'Erreur réseau — réessayez.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Connexion')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            const SizedBox(height: 12),
            _authHeader('Bon retour', 'Connectez-vous pour accéder à vos rendez-vous, commandes et plus.'),
            const SizedBox(height: 24),
            TextField(controller: _email, decoration: _dec('Email'), keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 12),
            TextField(
              controller: _password,
              obscureText: _obscure,
              decoration: _dec('Mot de passe',
                  suffix: IconButton(
                    icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off, size: 20),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  )),
              onSubmitted: (_) => _submit(),
            ),
            if (_err != null) ...[
              const SizedBox(height: 12),
              Text(_err!, style: const TextStyle(color: Colors.red, fontSize: 13)),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _busy ? null : _submit,
                child: _busy
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Se connecter', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _busy ? null : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ForgotPasswordScreen())),
                child: const Text('Mot de passe oublié ?'),
              ),
            ),
            const SizedBox(height: 4),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Text('Pas de compte ?', style: TextStyle(color: Colors.black54)),
              TextButton(
                onPressed: _busy
                    ? null
                    : () async {
                        final nav = Navigator.of(context);
                        final ok = await nav.push<bool>(MaterialPageRoute(builder: (_) => const SignupScreen()));
                        if (ok == true) nav.pop(true);
                      },
                child: const Text('Créer un compte'),
              ),
            ]),
          ]),
        ),
      ),
    );
  }
}

/// Patient sign-up. Pops `true` on success (backend auto-logs-in active patients).
class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  final _password = TextEditingController();
  String _dob = '', _gender = '';
  bool _busy = false, _obscure = true;
  String? _err;

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _phone.dispose();
    _address.dispose();
    _password.dispose();
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
    if (_password.text.length < 6) {
      setState(() => _err = 'Mot de passe : au moins 6 caractères.');
      return;
    }
    setState(() => _busy = true);
    try {
      final j = await AgentApi.register({
        'fullName': _fullName.text.trim(), 'email': _email.text.trim(), 'phone': _phone.text.trim(),
        'dateOfBirth': _dob, 'gender': _gender, 'address': _address.text.trim(), 'password': _password.text,
      });
      if (j['success'] == true) {
        if (mounted) Navigator.of(context).pop(true);
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
    return Scaffold(
      appBar: AppBar(title: const Text('Créer un compte')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            const SizedBox(height: 8),
            _authHeader('Créer votre compte', 'Gratuit — accédez à la réservation, au Health Shop et au suivi santé.'),
            const SizedBox(height: 20),
            TextField(controller: _fullName, decoration: _dec('Nom complet')),
            const SizedBox(height: 12),
            TextField(controller: _email, decoration: _dec('Email'), keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 12),
            TextField(controller: _phone, decoration: _dec('Téléphone'), keyboardType: TextInputType.phone),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: OutlinedButton(onPressed: _pickDob, child: Text(_dob.isEmpty ? 'Date de naissance' : _dob, overflow: TextOverflow.ellipsis))),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _gender.isEmpty ? null : _gender,
                  isDense: true,
                  decoration: _dec('Genre'),
                  items: const [
                    DropdownMenuItem(value: 'male', child: Text('Homme')),
                    DropdownMenuItem(value: 'female', child: Text('Femme')),
                    DropdownMenuItem(value: 'other', child: Text('Autre')),
                  ],
                  onChanged: (v) => setState(() => _gender = v ?? ''),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            TextField(controller: _address, decoration: _dec('Adresse')),
            const SizedBox(height: 12),
            TextField(
              controller: _password,
              obscureText: _obscure,
              decoration: _dec('Mot de passe (min. 6)',
                  suffix: IconButton(
                    icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off, size: 20),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  )),
            ),
            if (_err != null) ...[
              const SizedBox(height: 12),
              Text(_err!, style: const TextStyle(color: Colors.red, fontSize: 13)),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _busy ? null : _submit,
                child: _busy
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Créer mon compte', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(height: 12),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Text('Déjà un compte ?', style: TextStyle(color: Colors.black54)),
              TextButton(onPressed: _busy ? null : () => Navigator.of(context).pop(), child: const Text('Se connecter')),
            ]),
          ]),
        ),
      ),
    );
  }
}

/// Password recovery — 3 steps: email → security question/answer → new password.
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  final _answer = TextEditingController();
  final _password = TextEditingController();
  int _step = 0; // 0=email, 1=question, 2=new password
  String _question = '', _token = '';
  bool _busy = false, _obscure = true, _done = false;
  String? _err;

  @override
  void dispose() {
    _email.dispose();
    _answer.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _next() async {
    setState(() { _err = null; _busy = true; });
    try {
      if (_step == 0) {
        if (_email.text.trim().isEmpty) { setState(() => _err = 'Entrez votre email.'); return; }
        final q = await AgentApi.forgotPasswordQuestion(_email.text.trim());
        if (q == null) { setState(() => _err = 'Compte introuvable.'); return; }
        setState(() { _question = q; _step = 1; });
      } else if (_step == 1) {
        if (_answer.text.trim().isEmpty) { setState(() => _err = 'Entrez votre réponse.'); return; }
        final token = await AgentApi.forgotPasswordVerify(_email.text.trim(), _answer.text.trim());
        if (token == null) { setState(() => _err = 'Réponse incorrecte. Réessayez.'); return; }
        setState(() { _token = token; _step = 2; });
      } else {
        if (_password.text.length < 6) { setState(() => _err = 'Mot de passe : au moins 6 caractères.'); return; }
        final ok = await AgentApi.resetPassword(_token, _password.text);
        if (!ok) { setState(() => _err = 'Échec de la réinitialisation. Réessayez.'); return; }
        setState(() => _done = true);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mot de passe oublié')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: _done
              ? Column(children: [
                  const SizedBox(height: 24),
                  const Icon(Icons.check_circle, color: Color(0xFF27AE60), size: 56),
                  const SizedBox(height: 12),
                  const Text('Mot de passe mis à jour. Vous pouvez vous connecter.', textAlign: TextAlign.center, style: TextStyle(fontSize: 15, color: MediWyzColors.navy)),
                  const SizedBox(height: 20),
                  SizedBox(width: double.infinity, child: ElevatedButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Retour à la connexion'))),
                ])
              : Column(children: [
                  const SizedBox(height: 12),
                  _authHeader('Récupérer votre compte', _step == 0
                      ? 'Entrez votre email pour commencer.'
                      : _step == 1 ? 'Répondez à votre question de sécurité.' : 'Choisissez un nouveau mot de passe.'),
                  const SizedBox(height: 24),
                  if (_step == 0)
                    TextField(controller: _email, decoration: _dec('Email'), keyboardType: TextInputType.emailAddress),
                  if (_step == 1) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: MediWyzColors.sky.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
                      child: Text(_question, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: MediWyzColors.navy)),
                    ),
                    const SizedBox(height: 12),
                    TextField(controller: _answer, decoration: _dec('Votre réponse')),
                  ],
                  if (_step == 2)
                    TextField(
                      controller: _password,
                      obscureText: _obscure,
                      decoration: _dec('Nouveau mot de passe (min. 6)',
                          suffix: IconButton(icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off, size: 20), onPressed: () => setState(() => _obscure = !_obscure))),
                    ),
                  if (_err != null) ...[
                    const SizedBox(height: 12),
                    Text(_err!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                  ],
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _busy ? null : _next,
                      child: _busy
                          ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text(_step < 2 ? 'Continuer' : 'Réinitialiser', style: const TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ]),
        ),
      ),
    );
  }
}
