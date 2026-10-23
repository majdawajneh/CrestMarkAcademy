
using Domain.Entities.Identity;
using Infrastructure.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(
            CrestMark_DbContext context,
            IPasswordHasher<User> passwordHasher,
            IConfiguration configuration)
        {
            await using var transaction =
                await context.Database.BeginTransactionAsync();

            try
            {
                // =========================
                // 1. Seed Roles
                // =========================

                string[] roleNames =
                {
                    "Admin",
                    "Student",
                    "Instructor"
                };

                foreach (var roleName in roleNames)
                {
                    bool roleExists = await context.Roles
                        .AnyAsync(r => r.Name == roleName);

                    if (!roleExists)
                    {
                        await context.Roles.AddAsync(
                            new Role
                            {
                                Name = roleName
                            }
                        );
                    }
                }

                await context.SaveChangesAsync();

                // =========================
                // 2. Read Admin Settings
                // =========================

                var adminEmail =
                    configuration["SeedAdmin:Email"]?
                        .Trim()
                        .ToLowerInvariant();

                var adminUsername =
                    configuration["SeedAdmin:Username"]?
                        .Trim()
                        .ToLowerInvariant();

                var adminFirstName =
                    configuration["SeedAdmin:FirstName"]?
                        .Trim();

                var adminLastName =
                    configuration["SeedAdmin:LastName"]?
                        .Trim();

                var adminPhone =
                    configuration["SeedAdmin:PhoneNumber"]?
                        .Trim();

                if (string.IsNullOrWhiteSpace(adminEmail) ||
                    string.IsNullOrWhiteSpace(adminUsername) ||
                    string.IsNullOrWhiteSpace(adminFirstName) ||
                    string.IsNullOrWhiteSpace(adminLastName))
                {
                    throw new InvalidOperationException(
                        "SeedAdmin configuration is incomplete."
                    );
                }

                // =========================
                // 3. Find Existing Admin
                // =========================

                var admin = await context.Users
                    .FirstOrDefaultAsync(u =>
                        u.Email == adminEmail
                    );

                // =========================
                // 4. Check Username Conflict
                // =========================

                var usernameOwner = await context.Users
                    .FirstOrDefaultAsync(u =>
                        u.Username == adminUsername
                    );

                if (usernameOwner != null &&
                    (admin == null ||
                     usernameOwner.Id != admin.Id))
                {
                    throw new InvalidOperationException(
                        "Seed admin username is already used by another user."
                    );
                }

                bool adminWasCreated = admin == null;

                // =========================
                // 5. Create Admin
                // =========================

                if (admin == null)
                {
                    var adminPassword =
                        configuration["SeedAdmin:Password"];

                    if (string.IsNullOrWhiteSpace(adminPassword))
                    {
                        throw new InvalidOperationException(
                            "SeedAdmin password is required when creating the admin account."
                        );
                    }

                    admin = new User
                    {
                        FirstName = adminFirstName,
                        LastName = adminLastName,
                        Username = adminUsername,
                        Email = adminEmail,
                        IsActive = true,
                        EmailConfirmed = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    admin.PasswordHash =
                        passwordHasher.HashPassword(
                            admin,
                            adminPassword
                        );

                    await context.Users.AddAsync(admin);
                    await context.SaveChangesAsync();
                }

                // =========================
                // 6. Verify Existing Admin
                // =========================

                var adminRole = await context.Roles
                    .FirstAsync(r => r.Name == "Admin");

                bool hasAdminRole = await context.UserRoles
                    .AnyAsync(ur =>
                        ur.UserId == admin.Id &&
                        ur.RoleId == adminRole.Id
                    );

                if (!adminWasCreated && !hasAdminRole)
                {
                    throw new InvalidOperationException(
                        "Existing seed admin account does not have the Admin role."
                    );
                }

                // =========================
                // 7. Ensure Admin Profile
                // =========================

                bool profileExists =
                    await context.UserProfiles
                        .AnyAsync(up =>
                            up.UserId == admin.Id
                        );

                if (!profileExists)
                {
                    await context.UserProfiles.AddAsync(
                        new UserProfile
                        {
                            UserId = admin.Id,
                            PhoneNumber = adminPhone
                        }
                    );
                }

                // =========================
                // 8. Assign Role To New Admin
                // =========================

                if (adminWasCreated)
                {
                    await context.UserRoles.AddAsync(
                        new UserRole
                        {
                            UserId = admin.Id,
                            RoleId = adminRole.Id
                        }
                    );
                }

                // =========================
                // 9. Save Everything
                // =========================

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
