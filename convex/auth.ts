import Discord from "@auth/core/providers/discord";
import Google from "@auth/core/providers/google";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { convexAuth } from "@convex-dev/auth/server";

type AuthProvider =
  | typeof Discord
  | typeof Google
  | ReturnType<typeof Anonymous>;

const providers: AuthProvider[] = [
  Anonymous({
    profile: () => ({
      isAnonymous: true,
      name: "Local Tester",
    }),
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}

if (process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET) {
  providers.push(Discord);
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers,
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      const now = Date.now();
      let profileName = "OpenCord User";
      if (typeof args.profile.name === "string") {
        profileName = args.profile.name;
      } else if (typeof args.profile.email === "string") {
        profileName = args.profile.email.split("@")[0];
      }
      const avatarUrl =
        typeof args.profile.image === "string" ? args.profile.image : undefined;

      if (args.existingUserId) {
        await ctx.db.patch(args.existingUserId, {
          name: profileName,
          displayName: profileName,
          avatarUrl,
          updatedAt: now,
        });
        return args.existingUserId;
      }

      return await ctx.db.insert("users", {
        name: profileName,
        displayName: profileName,
        email:
          typeof args.profile.email === "string"
            ? args.profile.email
            : undefined,
        image: avatarUrl,
        avatarUrl,
        isAnonymous: args.profile.isAnonymous === true,
        createdAt: now,
        updatedAt: now,
      });
    },
  },
});
