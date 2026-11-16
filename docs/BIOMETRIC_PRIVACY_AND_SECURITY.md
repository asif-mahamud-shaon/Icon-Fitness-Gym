# 14. Biometric Privacy, Encryption & Data Protection Policy

> Opt-in consent enforcement, AES-256-GCM encryption at rest, response sanitization, and right-to-erasure controls.

---

## 14.1 Explicit Member Consent
- Biometric Face ID enrollment at Icon Fitness Gym is strictly **opt-in**.
- `BiometricSecurityService` rejects any enrollment payload where `consentGranted !== true` (`400 Bad Request`).
- Each enrollment records `consentGrantedAt`, `consentVersion` (`v1.0-BD-BIOMETRIC-POLICY`), `consentIpAddress`, and `enrolledByUserId`.

---

## 14.2 Cryptographic Storage & Zero Leakage Policy

| Protection Layer                 | Implementation Details                                                                      |
| :------------------------------- | :------------------------------------------------------------------------------------------ |
| **Mathematical Templates Only**  | Encrypted mathematical feature descriptors (`encryptedTemplateCipher`), never raw video streams |
| **AES-256-GCM at Rest**          | Unique 96-bit `IV` + 128-bit auth tag (`v1:<ivHex>:<authTagHex>:<cipherHex>`) via `BIOMETRIC_ENCRYPTION_KEY` |
| **Salted HMAC-SHA256 Lookup**    | Fast digest matching (`templateHash`) derived using `BIOMETRIC_HASH_SALT` without bulk decryption |
| **Zero API Cipher Exposure**     | `sanitizeEnrollmentForResponse` strips `encryptedTemplateCipher` and `templateHash` from all API responses |
| **Trainer Isolation**            | `MembersService` strips `biometricEnrollment`, `nidNumber`, and `accessEvents` from Trainer queries |

---

## 14.3 Right to Erasure & Retention Policy
- **Instant Member Self-Deletion:** Members can revoke consent and erase their biometric record anytime at `/member/access` (`DELETE /api/v1/access-control/biometrics/:memberProfileId`), or via an Admin at `/admin/access-control/biometrics`.
- **Overwrite Guarantee:** Erasure sets `encryptedTemplateCipher = null` and `templateHash = null`, switches `consentGranted = false` and `status = DELETED`, records `revokedAt`, and logs an immutable `AuditLog`.
- **Configurable Retention:** Managed via `biometricRetentionDays` (default `365` days) in `/admin/access-control/settings`.

---

← [13. Access Control API](./ACCESS_CONTROL_API.md) · Next: [15. Face Recognition Integration →](./FACE_RECOGNITION_INTEGRATION.md)
