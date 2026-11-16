# 07. Database Schema Specification

> **Engine:** PostgreSQL 16 · **ORM:** Prisma `5.22.0` (`backend/prisma/schema.prisma`)  
> **Scale:** `41` normalized UUID-keyed models across `10` domain groups

---

## 7.1 Design Standards
- **Primary Keys:** UUID v4 (`@id @default(uuid())`) everywhere to prevent ID enumeration.
- **Auditability:** All domain entities record `createdAt` and `updatedAt`; soft-deletable accounts carry `deletedAt`.
- **Precision:** Monetary amounts in Bangladeshi Taka (`BDT` / `৳`) use `Decimal @db.Decimal(10, 2)`.

---

## 7.2 Enum Catalog

- **Identity & Billing:** `Role` · `UserStatus` · `Gender` · `PlanDurationType` · `MembershipStatus` · `PaymentStatus` · `PaymentMethod`
- **Training & Classes:** `WorkoutGoal` · `DifficultyLevel` · `DayOfWeek` · `BookingStatus` · `AttendanceStatus`
- **Content & Alerts:** `MediaType` · `GalleryCategory` · `InquiryStatus` · `NotificationType`
- **Smart Access Control:** `DeviceStatus` · `DeviceVendorType` · `BiometricEnrollmentStatus` · `GymSessionType` · `SessionExceptionType` · `TrainerPresenceStatus` · `AccessDecision` · `AccessDenialCode` · `VerificationMethod` · `AccessDirection` · `DoorCommandStatus`
- **Icon Store:** `StoreCategory` · `StoreOrderStatus` · `DiscountType`
- **HRM & Accounting:** `HrmDepartment` · `HrmEmployeeStatus` · `GymExpenseCategory` · `LedgerPaymentStatus`
- **CRM & Retention:** `CrmLeadSource` · `CrmLeadStage` · `CrmActivityChannel` · `CrmActivityOutcome`

---

## 7.3 Complete Model Directory (`41` Models)

### 1. Identity & Tokens
- **`User`**: Central auth identity (`email`, `phone`, `passwordHash`, `fullName`, `role`, `status`, `permissionsJson`, `resetPasswordTokenHash`, `lastLoginAt`, `deletedAt`).
- **`RefreshToken`**: SHA-256 hashed refresh rotation records (`tokenHash`, `revokedAt`, `replacedByTokenHash`, `expiresAt`).

### 2. Member & Trainer Profiles
- **`MemberProfile`**: 1:1 member extension (`memberCode` `IFG-YYYY-XXXX`, `gender`, `address`, `bloodGroup`, `heightCm`, `weightKg`, `nidNumber`, `rfidCardNumber`, `fitnessGoal`, `assignedTrainerId`).
- **`TrainerProfile`**: 1:1 trainer profile (`slug`, `gender`, `headline`, `specializations[]`, `qualifications[]`, `experienceYears`, `isFeatured`, `isActive`).

### 3. Membership Plans, Subscriptions & Payments
- **`MembershipPlan`**: Configurable packages (`durationDays`, `priceBdt`, `admissionFeeBdt`, `discountPercent`, `discountBdt`, `benefits[]`, `isPublic`, `isActive`).
- **`Membership`**: Plan subscription history (`memberProfileId`, `planId`, `previousMembershipId`, `startDate`, `endDate`, `status`, `activatedByUserId`).
- **`Payment`**: Separated payment ledger (`amountBdt`, `discountBdt`, `netAmountBdt`, `paymentMethod`, `transactionReference`, `status`, `verifiedByUserId`, `refundedAmountBdt`).
- **`PaymentReceipt`**: Immutable receipt (`receiptNumber` `RCP-YYYYMM-XXXX`, `issuedToName`, `amountPaidBdt`, `receiptDataJson`).

### 4. Exercises & Workout Programs
- **`Exercise`**: Exercise library (`name`, `slug`, `targetMuscleGroup`, `difficulty`, `instructions`, `videoUrl`).
- **`WorkoutProgram`**: Structured templates (`title`, `slug`, `goal`, `difficulty`, `durationWeeks`, `daysPerWeek`, `createdByTrainerId`).
- **`WorkoutExercise`**: Ordered exercises inside a program (`dayNumber`, `orderIndex`, `sets`, `reps`, `restSeconds`, `tempo`).
- **`MemberWorkoutAssignment`**: Member assignment (`startDate`, `endDate`, `trainerNotes`, `memberProgressNotes`, `completionPercentage`).

### 5. Classes, Schedules, Bookings & Attendance
- **`GymClass`**: Class catalog (`title`, `slug`, `category`, `durationMinutes`, `defaultCapacity`, `isPublished`).
- **`ClassSchedule`**: Weekly slots (`dayOfWeek`, `startTime`, `endTime`, `roomOrZone`, `capacity`, `bookedCount`, `cancellationCutoffHours`).
- **`Booking`**: Member reservations (`classScheduleId`, `memberProfileId`, `sessionDate`, `status`, `checkedInAt`).
- **`Attendance`**: Class attendance (`classScheduleId`, `bookingId`, `memberProfileId`, `sessionDate`, `status`, `recordedByUserId`).

### 6. Content, Settings, Notifications & Audit Logs
- **`Facility`**, **`Gallery`**, **`Testimonial`**, **`ContactInquiry`**, **`Notification`**
- **`GymSettings`**: Singleton config (`singletonKey: "DEFAULT"`, contact numbers, `openingHoursJson`, `policiesJson`, `websiteConfigJson` CMS JSON, `currencySymbol: "৳"`).
- **`AuditLog`**: Immutable compliance log (`actorUserId`, `actorRole`, `action`, `entityType`, `entityId`, `summary`, `metadata`, `ipAddress`).

### 7. Smart Access Control & Gender Sessions (`9` Models)
- **`AccessDevice`**: Registered terminals (`deviceCode`, `vendorType`, `direction`, `apiKeyHash`, `isSimulated`, `status`, `lastHeartbeatAt`).
- **`BiometricEnrollment`**: 1:1 opt-in consent & AES-256-GCM descriptor (`consentGranted`, `encryptedTemplateCipher`, `templateHash`, `status`).
- **`GymSession`** & **`GymSessionException`**: `Asia/Dhaka` `MALE_SESSION` / `FEMALE_SESSION` schedule & holiday overrides.
- **`SessionTrainerAssignment`** & **`TrainerAttendance`**: Primary/replacement trainer pairing and physical check-in/out logs.
- **`AccessEvent`** & **`DoorControllerEvent`**: Idempotent access decisions (`GRANTED` / `DENIED`, `AccessDenialCode`) & relay status (`emergencyExitIndependent`).
- **`AccessControlSettings`**: Singleton policy configuration (`minFaceMatchConfidence`, `requireLivenessDetection`, `callbackReplayWindowSec`, `biometricRetentionDays`).

### 8. Icon Gear Store (`4` Models)
- **`StoreProduct`**: Inventory catalog (`sku`, `category`, `buyingPriceBdt`, `priceBdt`, `compareAtBdt`, `stockQty`, `imageUrl`, `isActive`).
- **`StoreDiscountCode`**: Promo codes (`code`, `discountType`, `discountValue`, `minOrderBdt`, `maxDiscountBdt`, `maxUses`, `usedCount`, `expiresAt`).
- **`StoreOrder`** & **`StoreOrderItem`**: Order header (`orderNumber` `IFG-ORD-*`, `fulfillmentType`, `deliveryFeeBdt`, `advancePaidBdt`, `isMemberVerified`, `status`) + line items with `unitCostBdt` & `profitBdt`.

### 9. Gym HRM & Accounting (`3` Models)
- **`HrmEmployee`**: Staff roster (`employeeCode`, `department`, `designation`, `baseSalaryBdt`, `defaultAllowanceBdt`, `status`).
- **`HrmSalaryPayment`**: Unique `(employeeId, monthKey)` salary disbursements (`bonusBdt`, `overtimeBdt`, `deductionBdt`, `netPaidBdt`).
- **`GymExpense`**: Facility utilities & operational expenses (`category`, `vendorName`, `billReference`, `monthKey`, `amountBdt`, `status`).

### 10. Gym CRM & Retention (`2` Models)
- **`CrmLead`**: Sales pipeline (`leadCode`, `source`, `stage`, `interestedPlan`, `assignedToUserId`, `nextFollowUpAt`, `sourceInquiryId`).
- **`CrmActivity`**: Multi-channel outreach log linked to either `CrmLead` or `MemberProfile` (`channel`, `outcome`, `summary`, `actorName`).

---

← [06. Backend Structure](./BACKEND_STRUCTURE.md) · Next: [08. Database Relationships →](./DATABASE_RELATIONSHIPS.md)
