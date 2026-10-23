
using Application.Dto_s.User;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using Domain.Entities.Identity;
using Domain.Entities.Identity__UserManagement_;
using System.Security.Cryptography;
using System.Text.Encodings.Web;
using Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace Application.Services
{
    public class AdminUserService : IAdminUserService
    {
        private readonly IUserRepository _userDetailsRepo;
        private readonly IGenericRepository<User> _userRepo;
        private readonly IGenericRepository<RefreshToken> _refreshTokenRepo;
        private readonly IGenericRepository<UserProfile> _profileRepo;
        private readonly IGenericRepository<UserToken> _userTokenRepo;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly IGenericRepository<Role> _roleRepo;
        private readonly IGenericRepository<UserRole> _userRoleRepo;
        private readonly IGenericRepository<Course> _courseRepo;

        public AdminUserService(
            IUserRepository userDetailsRepo,
            IGenericRepository<User> userRepo,
            IGenericRepository<RefreshToken> refreshTokenRepo,
            IGenericRepository<Role> roleRepo,
            IGenericRepository<UserRole> userRoleRepo,
            IGenericRepository<Course> courseRepo,
            IGenericRepository<UserProfile> profileRepo,
            IGenericRepository<UserToken> userTokenRepo,
            IPasswordHasher<User> passwordHasher,
            ITokenService tokenService,
            IEmailService emailService)
        {
            _userDetailsRepo = userDetailsRepo;
            _userRepo = userRepo;
            _refreshTokenRepo = refreshTokenRepo;
            _profileRepo = profileRepo;
            _userTokenRepo = userTokenRepo;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _emailService = emailService;
            _roleRepo = roleRepo;
            _userRoleRepo = userRoleRepo;
            _courseRepo = courseRepo;
        }

        // ========================================
        // Get All Users
        // ========================================

        public async Task<IEnumerable<AdminUserListDto>> GetAllAsync()
        {
            var users = await _userDetailsRepo
                .GetAllWithDetailsAsync();

            return users
                .Select(MapToListDto)
                .ToList();
        }

        // ========================================
        // Get User By Id
        // ========================================

        public async Task<AdminUserDetailsDto> GetByIdAsync(int id)
        {
            var user = await _userDetailsRepo
                .GetByIdWithDetailsAsync(id);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }

            return MapToDetailsDto(user);
        }

        // ========================================
        // Deactivate User
        // ========================================

        public async Task DeactivateAsync(
            int currentAdminUserId,
            int userId)
        {
            if (currentAdminUserId == userId)
            {
                throw new InvalidOperationException(
                    "You cannot deactivate your own account."
                );
            }

            var user = await _userDetailsRepo
                .GetByIdWithDetailsAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }

            if (!user.IsActive)
            {
                return;
            }

            var isAdmin = user.UserRoles.Any(
                ur => string.Equals(
                    ur.Role.Name,
                    "Admin",
                    StringComparison.OrdinalIgnoreCase
                )
            );

            if (isAdmin)
            {
                throw new InvalidOperationException(
                    "Admin accounts cannot be deactivated from this endpoint."
                );
            }

            var now = DateTime.UtcNow;

            user.IsActive = false;
            user.UpdatedAt = now;

            _userRepo.Update(user);

            var refreshTokens = await _refreshTokenRepo
                .FindAsync(
                    rt => rt.UserId == user.Id &&
                          !rt.IsRevoked
                );

            foreach (var refreshToken in refreshTokens)
            {
                refreshToken.IsRevoked = true;
                refreshToken.RevokedAt = now;

                _refreshTokenRepo.Update(refreshToken);
            }

            await _userRepo.SaveChangesAsync();
        }

        // ========================================
        // Activate User
        // ========================================

        public async Task ActivateAsync(int userId)
        {
            var user = await _userRepo.GetByIdAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }

            if (user.IsActive)
            {
                return;
            }

            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;

            _userRepo.Update(user);

            await _userRepo.SaveChangesAsync();
        }

        // ========================================
        // Assign Instructor Role
        // ========================================

        public async Task AssignInstructorAsync(int userId)
        {
            if (userId <= 0)
            {
                throw new ArgumentException(
                    "Invalid user ID."
                );
            }

            var user = await _userRepo.GetByIdAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }

            if (!user.IsActive)
            {
                throw new InvalidOperationException(
                    "Inactive users cannot be assigned as instructors."
                );
            }

            var instructorRole = await GetInstructorRoleAsync();

            var alreadyInstructor = await _userRoleRepo
                .ExistsAsync(
                    ur => ur.UserId == userId &&
                          ur.RoleId == instructorRole.Id
                );

            // Idempotent: already assigned.
            if (alreadyInstructor)
            {
                return;
            }

            var userRole = new UserRole
            {
                UserId = userId,
                RoleId = instructorRole.Id
            };

            await _userRoleRepo.AddAsync(userRole);

            user.UpdatedAt = DateTime.UtcNow;

            _userRepo.Update(user);

            await _userRoleRepo.SaveChangesAsync();
        }

        // ========================================
        // Remove Instructor Role
        // ========================================

        public async Task RemoveInstructorAsync(int userId)
        {
            if (userId <= 0)
            {
                throw new ArgumentException(
                    "Invalid user ID."
                );
            }

            var user = await _userRepo.GetByIdAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }

            var instructorRole = await GetInstructorRoleAsync();

            var userRole = await _userRoleRepo
                .FirstOrDefaultAsync(
                    ur => ur.UserId == userId &&
                          ur.RoleId == instructorRole.Id
                );

            // Idempotent: user doesn't have the role.
            if (userRole == null)
            {
                return;
            }

            // Do not remove the Instructor role while the
            // user is assigned to any course.
            var hasAssignedCourses = await _courseRepo
                .ExistsAsync(
                    course => course.InstructorId == userId
                );

            if (hasAssignedCourses)
            {
                throw new InvalidOperationException(
                    "This instructor is assigned to one or more courses. " +
                    "Reassign or unassign those courses before removing the role."
                );
            }

            _userRoleRepo.Delete(userRole);

            user.UpdatedAt = DateTime.UtcNow;

            _userRepo.Update(user);

            await _userRoleRepo.SaveChangesAsync();
        }



        public async Task<AdminUserDetailsDto> CreateInstructorAsync(
            CreateInstructorDto dto)
        {
            var firstName = dto.FirstName?.Trim() ?? "";
            var lastName = dto.LastName?.Trim() ?? "";
            var email = dto.Email?.Trim().ToLowerInvariant() ?? "";
            var username = dto.Username?.Trim().ToLowerInvariant() ?? "";

            if (firstName.Length < 2 || firstName.Length > 100 ||
                lastName.Length < 2 || lastName.Length > 100 ||
                username.Length < 3 || username.Length > 100 ||
                email.Length == 0 || email.Length > 256 ||
                !new System.ComponentModel.DataAnnotations.EmailAddressAttribute()
                    .IsValid(email))
            {
                throw new ArgumentException(
                    "Invalid instructor account information."
                );
            }

            if (await _userRepo.ExistsAsync(u => u.Email == email))
            {
                throw new InvalidOperationException(
                    "Email already exists."
                );
            }

            if (await _userRepo.ExistsAsync(u => u.Username == username))
            {
                throw new InvalidOperationException(
                    "Username already exists."
                );
            }



            var instructorRole = await GetInstructorRoleAsync();
            var now = DateTime.UtcNow;

            var user = new User
            {
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                Username = username,
                IsActive = true,
                EmailConfirmed = false,
                CreatedAt = now
            };

            // Random, undisclosed placeholder password.
            // Login remains blocked while EmailConfirmed is false.
            var randomPassword = Convert.ToHexString(
                RandomNumberGenerator.GetBytes(48)
            );

            user.PasswordHash = _passwordHasher.HashPassword(
                user,
                randomPassword
            );

            // Let EF Core obtain the new UserId.
            // These entities must use the same scoped DbContext.
            await _userRepo.AddAsync(user);
            await _userRepo.SaveChangesAsync();

            var invitationToken = _tokenService.GenerateVerificationToken();

            var token = new UserToken
            {
                UserId = user.Id,
                TokenHash = _tokenService.HashToken(invitationToken),
                Purpose = UserTokenPurpose.InstructorInvitation,
                CreatedAt = now,
                ExpiresAt = now.AddHours(24),
                IsUsed = false
            };

            await _profileRepo.AddAsync(
                new UserProfile
                {
                    UserId = user.Id
                }
            );

            await _userRoleRepo.AddAsync(
                new UserRole
                {
                    UserId = user.Id,
                    RoleId = instructorRole.Id
                }
            );

            await _userTokenRepo.AddAsync(token);

            await _userRepo.SaveChangesAsync();

            // Send invitation only after saving account and token.
            // Never return the invitation token to the API caller.
            var clientUrl = Environment.GetEnvironmentVariable(
                "CRESTMARK_CLIENT_URL"
            );

            if (string.IsNullOrWhiteSpace(clientUrl))
            {
                clientUrl = "http://localhost:3000";
            }

            clientUrl = clientUrl.TrimEnd('/');

            if (!Uri.TryCreate(clientUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttps &&
                 !(uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback)))
            {
                throw new InvalidOperationException(
                    "Invalid CrestMark client URL configuration."
                );
            }

            var invitationLink =
                $"{clientUrl}/en/instructor-invitation" +
                $"?token={Uri.EscapeDataString(invitationToken)}";

            var safeLink = HtmlEncoder.Default.Encode(invitationLink);
            var safeName = HtmlEncoder.Default.Encode(firstName);

            var emailBody = $"""
        <div style="font-family:Arial,sans-serif;
                    max-width:560px;margin:auto;
                    color:#102a52;line-height:1.7">

            <h2>Welcome to CrestMark</h2>

            <p>Hello {safeName},</p>

            <p>
                You've been invited to join CrestMark
                as an instructor.
            </p>

            <p>
                Please set your password and activate
                your account using the link below.
            </p>

            <p style="margin:30px 0">
                <a href="{safeLink}"
                   style="background:#2563eb;
                          color:#fff;
                          padding:14px 22px;
                          border-radius:8px;
                          text-decoration:none">
                    Activate Instructor Account
                </a>
            </p>

            <p>This invitation expires in 24 hours.</p>

            <p>
                If you were not expecting this invitation,
                please contact CrestMark.
            </p>
        </div>
        """;

            await _emailService.SendEmailAsync(
                user.Email,
                "Your CrestMark Instructor Invitation",
                emailBody
            );

            // Fetch with roles/profile for existing mapper.
            var created = await _userDetailsRepo.GetByIdWithDetailsAsync(
                user.Id
            );

            if (created == null)
            {
                throw new InvalidOperationException(
                    "Instructor created but could not be loaded."
                );
            }

            return MapToDetailsDto(created);
        }

        // ========================================
        // Resend Instructor Invitation
        // ========================================

        public async Task ResendInstructorInvitationAsync(int userId)
        {
            if (userId <= 0)
            {
                throw new ArgumentException("Invalid user ID.");
            }

            var user = await _userRepo.GetByIdAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }

            if (!user.IsActive)
            {
                throw new InvalidOperationException(
                    "Inactive users cannot receive invitations."
                );
            }

            if (user.EmailConfirmed)
            {
                throw new InvalidOperationException(
                    "Instructor account is already activated."
                );
            }

            var instructorRole = await GetInstructorRoleAsync();

            var isInstructor = await _userRoleRepo.ExistsAsync(
                ur => ur.UserId == userId &&
                      ur.RoleId == instructorRole.Id
            );

            if (!isInstructor)
            {
                throw new InvalidOperationException(
                    "This user is not an instructor."
                );
            }

            // Generate a new invitation token.
            var invitationToken =
                _tokenService.GenerateVerificationToken();

            var now = DateTime.UtcNow;

            var token = new UserToken
            {
                UserId = user.Id,
                TokenHash = _tokenService.HashToken(invitationToken),
                Purpose = UserTokenPurpose.InstructorInvitation,
                CreatedAt = now,
                ExpiresAt = now.AddHours(24),
                IsUsed = false
            };

            // Persist the token before sending the email.
            await _userTokenRepo.AddAsync(token);
            await _userTokenRepo.SaveChangesAsync();

            var clientUrl = Environment.GetEnvironmentVariable(
                "CRESTMARK_CLIENT_URL"
            );

            if (string.IsNullOrWhiteSpace(clientUrl))
            {
                clientUrl = "http://localhost:3000";
            }

            clientUrl = clientUrl.TrimEnd('/');

            if (!Uri.TryCreate(
                    clientUrl,
                    UriKind.Absolute,
                    out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttps &&
                 !(uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback)))
            {
                throw new InvalidOperationException(
                    "Invalid CrestMark client URL configuration."
                );
            }

            var invitationLink =
                $"{clientUrl}/en/instructor-invitation" +
                $"?token={Uri.EscapeDataString(invitationToken)}";

            var safeLink =
                HtmlEncoder.Default.Encode(invitationLink);

            var safeName =
                HtmlEncoder.Default.Encode(user.FirstName ?? "");

            var emailBody = $"""
                <div style="font-family:Arial,sans-serif;
                            max-width:560px;margin:auto;
                            color:#102a52;line-height:1.7">

                    <h2>CrestMark Instructor Invitation</h2>

                    <p>Hello {safeName},</p>

                    <p>
                        You have been invited to join CrestMark
                        as an instructor.
                    </p>

                    <p>
                        Set your password and activate your
                        account using the link below.
                    </p>

                    <p style="margin:30px 0">
                        <a href="{safeLink}"
                           style="background:#2563eb;
                                  color:#fff;
                                  padding:14px 22px;
                                  border-radius:8px;
                                  text-decoration:none">
                            Activate Instructor Account
                        </a>
                    </p>

                    <p>This invitation expires in 24 hours.</p>

                    <p>
                        If you were not expecting this invitation,
                        please contact CrestMark.
                    </p>
                </div>
                """;

            // An SMTP exception propagates to the API.
            // Do not report success when sending fails.
            await _emailService.SendEmailAsync(
                user.Email,
                "Your CrestMark Instructor Invitation",
                emailBody
            );
        }


        // ========================================
        // Resolve Instructor Role
        // ========================================

        private async Task<Role> GetInstructorRoleAsync()
        {
            var role = await _roleRepo
                .FirstOrDefaultAsync(
                    r => r.Name == "Instructor"
                );

            if (role == null)
            {
                throw new InvalidOperationException(
                    "Instructor role was not found. Configure the role first."
                );
            }

            return role;
        }

        // ========================================
        // Map List
        // ========================================

        private static AdminUserListDto MapToListDto(User user)
        {
            return new AdminUserListDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Username = user.Username,
                Email = user.Email,
                IsActive = user.IsActive,
                EmailConfirmed = user.EmailConfirmed,

                Roles = user.UserRoles
                    .Select(ur => ur.Role.Name)
                    .ToList(),

                CreatedAt = user.CreatedAt
            };
        }

        // ========================================
        // Map Details
        // ========================================

        private static AdminUserDetailsDto MapToDetailsDto(User user)
        {
            return new AdminUserDetailsDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Username = user.Username,
                Email = user.Email,
                IsActive = user.IsActive,
                EmailConfirmed = user.EmailConfirmed,

                Roles = user.UserRoles
                    .Select(ur => ur.Role.Name)
                    .ToList(),

                ProfileImageUrl = user.UserProfile?
                    .ProfileImageUrl,

                Bio = user.UserProfile?.Bio,
                PhoneNumber = user.UserProfile?.PhoneNumber,
                Country = user.UserProfile?.Country,
                DateOfBirth = user.UserProfile?.DateOfBirth,

                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
        }
    }
}
