## Summary

<!-- What does this PR do and why? -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / tech debt
- [ ] CI/CD / infra
- [ ] Documentation

## Pre-merge checklist

> Answer all 10 for user-visible changes. Write "N/A" + reason for infra-only PRs.

1. **Activation metric** — Can you name the analytics event for the primary CTA? Where does it fire?
2. **Feature flag** — Is this behind a flag? What's the default in prod?
3. **Empty state** — What does the UI say when there's no data? Is there a next-action CTA?
4. **Error handling** — What happens on network error? On 4xx? On 5xx?
5. **i18n** — Has a non-English user seen this screen? (Test with `fr` locale.)
6. **Accessibility** — Is every icon-only button labelled? Contrast ≥ 4.5:1?
7. **Performance** — First meaningful paint ≤ 1.5s on 3G? Bundle delta?
8. **Role scoping** — Which roles can see this? Can they NOT see competitors' data?
9. **Dynamic roles** — Zero `userType === 'DOCTOR'` / hardcoded role arrays in diff? (`grep -E "userType\s*===\s*'[A-Z_]+'"`)
10. **Money flows** — Any debit/credit? Is there a `WalletTransaction` ledger entry + pre-flight balance check?

## Test plan

<!-- What did you test manually? Which automated tests cover this? -->

- [ ] Unit tests added / updated
- [ ] E2E golden path still green locally
- [ ] Tested on mobile viewport (375 × 812)
