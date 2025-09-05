import { z } from "zod";

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum([
  "ReadUncommitted",
  "ReadCommitted",
  "RepeatableRead",
  "Serializable",
]);

export const SponsorScalarFieldEnumSchema = z.enum([
  "id",
  "createdAt",
  "updatedAt",
  "name",
  "contact",
  "portfolioUrl",
]);

export const PortfolioCompanyScalarFieldEnumSchema = z.enum([
  "id",
  "createdAt",
  "updatedAt",
  "asset",
  "dateInvested",
  "sector",
  "webpage",
  "description",
  "location",
  "status",
  "sponsorId",
]);

export const AccountScalarFieldEnumSchema = z.enum([
  "id",
  "userId",
  "type",
  "provider",
  "providerAccountId",
  "refresh_token",
  "access_token",
  "expires_at",
  "token_type",
  "scope",
  "id_token",
  "session_state",
  "refresh_token_expires_in",
]);

export const SessionScalarFieldEnumSchema = z.enum([
  "id",
  "sessionToken",
  "userId",
  "expires",
]);

export const UserScalarFieldEnumSchema = z.enum([
  "id",
  "name",
  "email",
  "emailVerified",
  "image",
]);

export const VerificationTokenScalarFieldEnumSchema = z.enum([
  "identifier",
  "token",
  "expires",
]);

export const CommentScalarFieldEnumSchema = z.enum([
  "id",
  "createdAt",
  "updatedAt",
  "content",
  "authorId",
  "companyId",
]);

export const WatchlistScalarFieldEnumSchema = z.enum([
  "id",
  "createdAt",
  "userId",
  "companyId",
]);

export const AlertScalarFieldEnumSchema = z.enum([
  "id",
  "createdAt",
  "readAt",
  "type",
  "message",
  "userId",
  "companyId",
]);

export const RunScalarFieldEnumSchema = z.enum([
  "id",
  "createdAt",
  "durationMs",
  "inputSponsor",
  "portfolioUrlsCount",
  "crawledCount",
  "extractedCount",
  "normalizedCount",
  "enrichedCount",
  "userId",
]);

export const SortOrderSchema = z.enum(["asc", "desc"]);

export const QueryModeSchema = z.enum(["default", "insensitive"]);

export const NullsOrderSchema = z.enum(["first", "last"]);

export const CompanyStatusSchema = z.enum(["ACTIVE", "EXITED"]);

export type CompanyStatusType = `${z.infer<typeof CompanyStatusSchema>}`;

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// SPONSOR SCHEMA
/////////////////////////////////////////

export const SponsorSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  name: z.string(),
  contact: z.string().nullable(),
  portfolioUrl: z.string().nullable(),
});

export type Sponsor = z.infer<typeof SponsorSchema>;

// SPONSOR RELATION SCHEMA
//------------------------------------------------------

export type SponsorRelations = {
  portfolio: PortfolioCompanyWithRelations[];
};

export type SponsorWithRelations = z.infer<typeof SponsorSchema> &
  SponsorRelations;

export const SponsorWithRelationsSchema: z.ZodType<SponsorWithRelations> =
  SponsorSchema.merge(
    z.object({
      portfolio: z.lazy(() => PortfolioCompanyWithRelationsSchema).array(),
    }),
  );

/////////////////////////////////////////
// PORTFOLIO COMPANY SCHEMA
/////////////////////////////////////////

export const PortfolioCompanySchema = z.object({
  status: CompanyStatusSchema,
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  asset: z.string(),
  dateInvested: z.coerce.date().nullable(),
  sector: z.string().nullable(),
  webpage: z.string().nullable(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  sponsorId: z.string(),
});

export type PortfolioCompany = z.infer<typeof PortfolioCompanySchema>;

// PORTFOLIO COMPANY RELATION SCHEMA
//------------------------------------------------------

export type PortfolioCompanyRelations = {
  Alert: AlertWithRelations[];
  comments: CommentWithRelations[];
  sponsor: SponsorWithRelations;
  watchlistedBy: WatchlistWithRelations[];
};

export type PortfolioCompanyWithRelations = z.infer<
  typeof PortfolioCompanySchema
> &
  PortfolioCompanyRelations;

export const PortfolioCompanyWithRelationsSchema: z.ZodType<PortfolioCompanyWithRelations> =
  PortfolioCompanySchema.merge(
    z.object({
      Alert: z.lazy(() => AlertWithRelationsSchema).array(),
      comments: z.lazy(() => CommentWithRelationsSchema).array(),
      sponsor: z.lazy(() => SponsorWithRelationsSchema),
      watchlistedBy: z.lazy(() => WatchlistWithRelationsSchema).array(),
    }),
  );

/////////////////////////////////////////
// ACCOUNT SCHEMA
/////////////////////////////////////////

export const AccountSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  type: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refresh_token: z.string().nullable(),
  access_token: z.string().nullable(),
  expires_at: z.number().int().nullable(),
  token_type: z.string().nullable(),
  scope: z.string().nullable(),
  id_token: z.string().nullable(),
  session_state: z.string().nullable(),
  refresh_token_expires_in: z.number().int().nullable(),
});

export type Account = z.infer<typeof AccountSchema>;

// ACCOUNT RELATION SCHEMA
//------------------------------------------------------

export type AccountRelations = {
  user: UserWithRelations;
};

export type AccountWithRelations = z.infer<typeof AccountSchema> &
  AccountRelations;

export const AccountWithRelationsSchema: z.ZodType<AccountWithRelations> =
  AccountSchema.merge(
    z.object({
      user: z.lazy(() => UserWithRelationsSchema),
    }),
  );

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.string().cuid(),
  sessionToken: z.string(),
  userId: z.string(),
  expires: z.coerce.date(),
});

export type Session = z.infer<typeof SessionSchema>;

// SESSION RELATION SCHEMA
//------------------------------------------------------

export type SessionRelations = {
  user: UserWithRelations;
};

export type SessionWithRelations = z.infer<typeof SessionSchema> &
  SessionRelations;

export const SessionWithRelationsSchema: z.ZodType<SessionWithRelations> =
  SessionSchema.merge(
    z.object({
      user: z.lazy(() => UserWithRelationsSchema),
    }),
  );

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  emailVerified: z.coerce.date().nullable(),
  image: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;

// USER RELATION SCHEMA
//------------------------------------------------------

export type UserRelations = {
  accounts: AccountWithRelations[];
  alerts: AlertWithRelations[];
  comments: CommentWithRelations[];
  runs: RunWithRelations[];
  sessions: SessionWithRelations[];
  watchlist: WatchlistWithRelations[];
};

export type UserWithRelations = z.infer<typeof UserSchema> & UserRelations;

export const UserWithRelationsSchema: z.ZodType<UserWithRelations> =
  UserSchema.merge(
    z.object({
      accounts: z.lazy(() => AccountWithRelationsSchema).array(),
      alerts: z.lazy(() => AlertWithRelationsSchema).array(),
      comments: z.lazy(() => CommentWithRelationsSchema).array(),
      runs: z.lazy(() => RunWithRelationsSchema).array(),
      sessions: z.lazy(() => SessionWithRelationsSchema).array(),
      watchlist: z.lazy(() => WatchlistWithRelationsSchema).array(),
    }),
  );

/////////////////////////////////////////
// VERIFICATION TOKEN SCHEMA
/////////////////////////////////////////

export const VerificationTokenSchema = z.object({
  identifier: z.string(),
  token: z.string(),
  expires: z.coerce.date(),
});

export type VerificationToken = z.infer<typeof VerificationTokenSchema>;

/////////////////////////////////////////
// COMMENT SCHEMA
/////////////////////////////////////////

export const CommentSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  content: z.string(),
  authorId: z.string(),
  companyId: z.string(),
});

export type Comment = z.infer<typeof CommentSchema>;

// COMMENT RELATION SCHEMA
//------------------------------------------------------

export type CommentRelations = {
  author: UserWithRelations;
  company: PortfolioCompanyWithRelations;
};

export type CommentWithRelations = z.infer<typeof CommentSchema> &
  CommentRelations;

export const CommentWithRelationsSchema: z.ZodType<CommentWithRelations> =
  CommentSchema.merge(
    z.object({
      author: z.lazy(() => UserWithRelationsSchema),
      company: z.lazy(() => PortfolioCompanyWithRelationsSchema),
    }),
  );

/////////////////////////////////////////
// WATCHLIST SCHEMA
/////////////////////////////////////////

export const WatchlistSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  userId: z.string(),
  companyId: z.string(),
});

export type Watchlist = z.infer<typeof WatchlistSchema>;

// WATCHLIST RELATION SCHEMA
//------------------------------------------------------

export type WatchlistRelations = {
  company: PortfolioCompanyWithRelations;
  user: UserWithRelations;
};

export type WatchlistWithRelations = z.infer<typeof WatchlistSchema> &
  WatchlistRelations;

export const WatchlistWithRelationsSchema: z.ZodType<WatchlistWithRelations> =
  WatchlistSchema.merge(
    z.object({
      company: z.lazy(() => PortfolioCompanyWithRelationsSchema),
      user: z.lazy(() => UserWithRelationsSchema),
    }),
  );

/////////////////////////////////////////
// ALERT SCHEMA
/////////////////////////////////////////

export const AlertSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  readAt: z.coerce.date().nullable(),
  type: z.string(),
  message: z.string(),
  userId: z.string(),
  companyId: z.string().nullable(),
});

export type Alert = z.infer<typeof AlertSchema>;

// ALERT RELATION SCHEMA
//------------------------------------------------------

export type AlertRelations = {
  company?: PortfolioCompanyWithRelations | null;
  user: UserWithRelations;
};

export type AlertWithRelations = z.infer<typeof AlertSchema> & AlertRelations;

export const AlertWithRelationsSchema: z.ZodType<AlertWithRelations> =
  AlertSchema.merge(
    z.object({
      company: z.lazy(() => PortfolioCompanyWithRelationsSchema).nullable(),
      user: z.lazy(() => UserWithRelationsSchema),
    }),
  );

/////////////////////////////////////////
// RUN SCHEMA
/////////////////////////////////////////

export const RunSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  durationMs: z.number().int(),
  inputSponsor: z.string(),
  portfolioUrlsCount: z.number().int(),
  crawledCount: z.number().int().nullable(),
  extractedCount: z.number().int(),
  normalizedCount: z.number().int(),
  enrichedCount: z.number().int(),
  userId: z.string().nullable(),
});

export type Run = z.infer<typeof RunSchema>;

// RUN RELATION SCHEMA
//------------------------------------------------------

export type RunRelations = {
  user?: UserWithRelations | null;
};

export type RunWithRelations = z.infer<typeof RunSchema> & RunRelations;

export const RunWithRelationsSchema: z.ZodType<RunWithRelations> =
  RunSchema.merge(
    z.object({
      user: z.lazy(() => UserWithRelationsSchema).nullable(),
    }),
  );
