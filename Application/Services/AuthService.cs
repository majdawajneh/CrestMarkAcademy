using Application.Dto_s.Auth;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Identity;
using Domain.Entities.Identity__UserManagement_;
using Domain.Enums;
using Microsoft.AspNetCore.Identity;
using System.Text.Encodings.Web;

namespace Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IGenericRepository<User> _userRepo;
        private readonly IGenericRepository<UserProfile> _profileRepo;
        private readonly IGenericRepository<Role> _roleRepo;
        private readonly IGenericRepository<UserRole> _userRoleRepo;
        private readonly IGenericRepository<RefreshToken> _refreshTokenRepo;
        private readonly IGenericRepository<UserToken> _userTokenRepo;
        private readonly IEmailService _emailService;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly ITokenService _tokenService;


        public AuthService(
            IGenericRepository<User> userRepo,
            IGenericRepository<UserProfile> profileRepo,
            IGenericRepository<Role> roleRepo,
            IGenericRepository<UserRole> userRoleRepo,
            IGenericRepository<RefreshToken> refreshTokenRepo,
            IGenericRepository<UserToken> userTokenRepo,
            IPasswordHasher<User> passwordHasher,
            ITokenService tokenService,
            IEmailService emailService)
        {
            _userRepo = userRepo;
            _profileRepo = profileRepo;
            _roleRepo = roleRepo;
            _userRoleRepo = userRoleRepo;
            _refreshTokenRepo = refreshTokenRepo;
            _userTokenRepo = userTokenRepo;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _emailService = emailService;
        }


        // =========================
        // Register
        // =========================

        public async Task<RegisterResponseDto> RegisterAsync(
            RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                throw new ArgumentException(
                    "Email is required."
                );
            }


            if (string.IsNullOrWhiteSpace(dto.Username))
            {
                throw new ArgumentException(
                    "Username is required."
                );
            }


            var email =
                dto.Email
                    .Trim()
                    .ToLowerInvariant();


            var username =
                dto.Username
                    .Trim()
                    .ToLowerInvariant();


            // =========================
            // Check Email
            // =========================

            var emailExists =
                await _userRepo.ExistsAsync(
                    u => u.Email == email
                );


            if (emailExists)
            {
                throw new InvalidOperationException(
                    "Email already exists."
                );
            }


            // =========================
            // Check Username
            // =========================

            var usernameExists =
                await _userRepo.ExistsAsync(
                    u => u.Username == username
                );


            if (usernameExists)
            {
                throw new InvalidOperationException(
                    "Username already exists."
                );
            }


            // =========================
            // Find Student Role
            // =========================

            var studentRole =
                await _roleRepo
                    .FirstOrDefaultAsync(
                        r => r.Name == "Student"
                    );


            if (studentRole == null)
            {
                throw new InvalidOperationException(
                    "Student role was not found."
                );
            }


            var now =
                DateTime.UtcNow;


            // =========================
            // Create User
            // =========================

            var user =
                new User
                {
                    FirstName =
                        dto.FirstName.Trim(),

                    LastName =
                        dto.LastName.Trim(),

                    Username =
                        username,

                    Email =
                        email,

                    IsActive =
                        true,

                    EmailConfirmed =
                        false,

                    CreatedAt =
                        now
                };


            // =========================
            // Hash Password
            // =========================

            user.PasswordHash =
                _passwordHasher
                    .HashPassword(
                        user,
                        dto.Password
                    );


            // User must be saved first
            // so we get its Id.

            await _userRepo
                .AddAsync(
                    user
                );


            await _userRepo
                .SaveChangesAsync();


            // =========================
            // Confirmation Token
            // =========================

            var verificationToken =
                _tokenService
                    .GenerateVerificationToken();


            var verificationTokenHash =
                _tokenService
                    .HashToken(
                        verificationToken
                    );


            var emailConfirmationToken =
                new UserToken
                {
                    UserId =
                        user.Id,

                    TokenHash =
                        verificationTokenHash,

                    Purpose =
                        UserTokenPurpose
                            .EmailConfirmation,

                    CreatedAt =
                        now,

                    ExpiresAt =
                        now.AddHours(24),

                    IsUsed =
                        false
                };


            await _userTokenRepo
                .AddAsync(
                    emailConfirmationToken
                );


            // =========================
            // User Profile
            // =========================

            var profile =
                new UserProfile
                {
                    UserId =
                        user.Id,

                    PhoneNumber =
                        string.IsNullOrWhiteSpace(
                            dto.PhoneNumber
                        )
                            ? null
                            : dto.PhoneNumber.Trim()
                };


            await _profileRepo
                .AddAsync(
                    profile
                );


            // =========================
            // Student Role
            // =========================

            var userRole =
                new UserRole
                {
                    UserId =
                        user.Id,

                    RoleId =
                        studentRole.Id
                };


            await _userRoleRepo
                .AddAsync(
                    userRole
                );


            // Shared scoped DbContext.
            await _userRepo
                .SaveChangesAsync();


            // =========================
            // Confirmation Email
            // =========================

            var emailBody = BuildConfirmationEmail(
                user.FirstName,
                verificationToken
            );


            bool emailSent;


            try
            {
                await _emailService
                    .SendEmailAsync(
                        user.Email,
                        "Confirm your CrestMark Academy email",
                        emailBody
                    );


                emailSent =
                    true;
            }
            catch
            {
                emailSent =
                    false;
            }


            return new RegisterResponseDto
            {
                UserId =
                    user.Id,

                Email =
                    user.Email,

                EmailSent =
                    emailSent,

                Message =
                    emailSent
                        ? "Registration successful. Please confirm your email."
                        : "Registration successful, but the confirmation email could not be sent. Please request a new confirmation email."
            };
        }


        // =========================
        // Login
        // =========================

        public async Task<AuthResponseDto> LoginAsync(
            LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(
                    dto.Identifier))
            {
                throw new UnauthorizedAccessException(
                    "Invalid username/email or password."
                );
            }


            var identifier =
                dto.Identifier
                    .Trim()
                    .ToLowerInvariant();


            // =========================
            // Find User
            // =========================

            var user =
                await _userRepo
                    .FirstOrDefaultAsync(
                        u =>
                            u.Email == identifier ||
                            u.Username == identifier
                    );


            if (user == null)
            {
                throw new UnauthorizedAccessException(
                    "Invalid username/email or password."
                );
            }


            // =========================
            // User Status
            // =========================

            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException(
                    "This account is inactive."
                );
            }


            // =========================
            // Verify Password
            // =========================

            var passwordResult =
                _passwordHasher
                    .VerifyHashedPassword(
                        user,
                        user.PasswordHash,
                        dto.Password
                    );


            if (passwordResult ==
                PasswordVerificationResult.Failed)
            {
                throw new UnauthorizedAccessException(
                    "Invalid username/email or password."
                );
            }


            // Update old password hash format
            // when Identity recommends rehashing.

            if (passwordResult ==
                PasswordVerificationResult
                    .SuccessRehashNeeded)
            {
                user.PasswordHash =
                    _passwordHasher
                        .HashPassword(
                            user,
                            dto.Password
                        );


                user.UpdatedAt =
                    DateTime.UtcNow;


                _userRepo.Update(
                    user
                );


                await _userRepo
                    .SaveChangesAsync();
            }


            // =========================
            // Email Confirmation
            // =========================

            if (!user.EmailConfirmed)
            {
                throw new UnauthorizedAccessException(
                    "Please confirm your email before logging in."
                );
            }


            // =========================
            // Roles
            // =========================

            var roles =
                await GetUserRolesAsync(
                    user.Id
                );


            // =========================
            // Access Token
            // =========================

            var accessToken =
                _tokenService
                    .GenerateAccessToken(
                        user,
                        roles
                    );


            // =========================
            // Refresh Token
            // =========================

            var now =
                DateTime.UtcNow;


            var refreshTokenValue =
                _tokenService
                    .GenerateRefreshToken();


            var refreshToken =
                new RefreshToken
                {
                    UserId =
                        user.Id,

                    Token =
                        refreshTokenValue,

                    CreatedAt =
                        now,

                    ExpiresAt =
                        now.AddDays(7),

                    IsRevoked =
                        false
                };


            await _refreshTokenRepo
                .AddAsync(
                    refreshToken
                );


            await _refreshTokenRepo
                .SaveChangesAsync();


            return new AuthResponseDto
            {
                UserId =
                    user.Id,

                FirstName =
                    user.FirstName,

                LastName =
                    user.LastName,

                Username =
                    user.Username,

                Email =
                    user.Email,

                AccessToken =
                    accessToken.Token,

                RefreshToken =
                    refreshTokenValue,

                AccessTokenExpiresAt =
                    accessToken.ExpiresAt,

                Roles =
                    roles
            };
        }


        // =========================
        // Refresh Token
        // =========================

        public async Task<AuthResponseDto>
            RefreshTokenAsync(
                RefreshTokenDto dto)
        {
            var refreshTokenValue =
                dto.RefreshToken?
                    .Trim();


            if (string.IsNullOrWhiteSpace(
                    refreshTokenValue))
            {
                throw new UnauthorizedAccessException(
                    "Invalid or expired refresh token."
                );
            }


            // =========================
            // Find Refresh Token
            // =========================

            var storedRefreshToken =
                await _refreshTokenRepo
                    .FirstOrDefaultAsync(
                        rt =>
                            rt.Token ==
                            refreshTokenValue
                    );


            var now =
                DateTime.UtcNow;


            // =========================
            // Validate Token
            // =========================

            if (storedRefreshToken == null ||
                storedRefreshToken.IsRevoked ||
                storedRefreshToken.ExpiresAt <= now)
            {
                throw new UnauthorizedAccessException(
                    "Invalid or expired refresh token."
                );
            }


            // =========================
            // Get User
            // =========================

            var user =
                await _userRepo
                    .GetByIdAsync(
                        storedRefreshToken.UserId
                    );


            if (user == null ||
                !user.IsActive)
            {
                throw new UnauthorizedAccessException(
                    "Invalid or expired refresh token."
                );
            }


            if (!user.EmailConfirmed)
            {
                throw new UnauthorizedAccessException(
                    "Please confirm your email."
                );
            }


            // =========================
            // Roles
            // =========================

            var roles =
                await GetUserRolesAsync(
                    user.Id
                );


            // =========================
            // Rotate Refresh Token
            // =========================

            storedRefreshToken.IsRevoked =
                true;

            storedRefreshToken.RevokedAt =
                now;


            _refreshTokenRepo.Update(
                storedRefreshToken
            );


            // =========================
            // New Access Token
            // =========================

            var accessToken =
                _tokenService
                    .GenerateAccessToken(
                        user,
                        roles
                    );


            // =========================
            // New Refresh Token
            // =========================

            var newRefreshTokenValue =
                _tokenService
                    .GenerateRefreshToken();


            var newRefreshToken =
                new RefreshToken
                {
                    UserId =
                        user.Id,

                    Token =
                        newRefreshTokenValue,

                    CreatedAt =
                        now,

                    ExpiresAt =
                        now.AddDays(7),

                    IsRevoked =
                        false
                };


            await _refreshTokenRepo
                .AddAsync(
                    newRefreshToken
                );


            // Revoke old + create new
            // in one SaveChanges.

            await _refreshTokenRepo
                .SaveChangesAsync();


            return new AuthResponseDto
            {
                UserId =
                    user.Id,

                FirstName =
                    user.FirstName,

                LastName =
                    user.LastName,

                Username =
                    user.Username,

                Email =
                    user.Email,

                AccessToken =
                    accessToken.Token,

                RefreshToken =
                    newRefreshTokenValue,

                AccessTokenExpiresAt =
                    accessToken.ExpiresAt,

                Roles =
                    roles
            };
        }


        // =========================
        // Logout
        // =========================

        public async Task LogoutAsync(
            LogoutDto dto)
        {
            var tokenValue =
                dto.RefreshToken?
                    .Trim();


            if (string.IsNullOrWhiteSpace(
                    tokenValue))
            {
                return;
            }


            var refreshToken =
                await _refreshTokenRepo
                    .FirstOrDefaultAsync(
                        rt =>
                            rt.Token ==
                            tokenValue
                    );


            if (refreshToken == null ||
                refreshToken.IsRevoked)
            {
                return;
            }


            refreshToken.IsRevoked =
                true;

            refreshToken.RevokedAt =
                DateTime.UtcNow;


            _refreshTokenRepo.Update(
                refreshToken
            );


            await _refreshTokenRepo
                .SaveChangesAsync();
        }


        // =========================
        // Confirm Email
        // =========================

        public async Task ConfirmEmailAsync(
            ConfirmEmailDto dto)
        {
            if (string.IsNullOrWhiteSpace(
                    dto.Token))
            {
                throw new InvalidOperationException(
                    "Invalid or expired confirmation token."
                );
            }


            var tokenHash =
                _tokenService
                    .HashToken(
                        dto.Token.Trim()
                    );


            var userToken =
                await _userTokenRepo
                    .FirstOrDefaultAsync(
                        ut =>
                            ut.TokenHash ==
                                tokenHash &&
                            ut.Purpose ==
                                UserTokenPurpose
                                    .EmailConfirmation
                    );


            var now =
                DateTime.UtcNow;


            if (userToken == null ||
                userToken.IsUsed ||
                userToken.ExpiresAt <= now)
            {
                throw new InvalidOperationException(
                    "Invalid or expired confirmation token."
                );
            }


            var user =
                await _userRepo
                    .GetByIdAsync(
                        userToken.UserId
                    );


            // Do not allow confirmation
            // for disabled accounts.

            if (user == null ||
                !user.IsActive)
            {
                throw new InvalidOperationException(
                    "Invalid or expired confirmation token."
                );
            }


            // =========================
            // Confirm User
            // =========================

            user.EmailConfirmed =
                true;

            user.UpdatedAt =
                now;


            _userRepo.Update(
                user
            );


            // =========================
            // Use Current Token
            // =========================

            userToken.IsUsed =
                true;

            userToken.UsedAt =
                now;


            _userTokenRepo.Update(
                userToken
            );


            // =========================
            // Invalidate Other Tokens
            // =========================

            var otherTokens =
                await _userTokenRepo
                    .FindAsync(
                        ut =>
                            ut.UserId ==
                                user.Id &&
                            ut.Purpose ==
                                UserTokenPurpose
                                    .EmailConfirmation &&
                            !ut.IsUsed &&
                            ut.Id !=
                                userToken.Id
                    );


            foreach (var token
                     in otherTokens)
            {
                token.IsUsed =
                    true;

                token.UsedAt =
                    now;


                _userTokenRepo.Update(
                    token
                );
            }


            await _userTokenRepo
                .SaveChangesAsync();
        }


        // =========================
        // Resend Confirmation
        // =========================

        public async Task
            ResendConfirmationEmailAsync(
                ResendConfirmationDto dto)
        {
            if (string.IsNullOrWhiteSpace(
                    dto.Email))
            {
                return;
            }


            var email =
                dto.Email
                    .Trim()
                    .ToLowerInvariant();


            var user =
                await _userRepo
                    .FirstOrDefaultAsync(
                        u =>
                            u.Email ==
                            email
                    );


            // Keep response generic:
            // do not reveal account state.

            if (user == null ||
                !user.IsActive ||
                user.EmailConfirmed)
            {
                return;
            }


            var now =
                DateTime.UtcNow;


            // =========================
            // Invalidate Old Tokens
            // =========================

            var oldTokens =
                await _userTokenRepo
                    .FindAsync(
                        ut =>
                            ut.UserId ==
                                user.Id &&
                            ut.Purpose ==
                                UserTokenPurpose
                                    .EmailConfirmation &&
                            !ut.IsUsed
                    );


            foreach (var oldToken
                     in oldTokens)
            {
                oldToken.IsUsed =
                    true;

                oldToken.UsedAt =
                    now;


                _userTokenRepo.Update(
                    oldToken
                );
            }


            // =========================
            // Generate New Token
            // =========================

            var verificationToken =
                _tokenService
                    .GenerateVerificationToken();


            var verificationTokenHash =
                _tokenService
                    .HashToken(
                        verificationToken
                    );


            var newUserToken =
                new UserToken
                {
                    UserId =
                        user.Id,

                    TokenHash =
                        verificationTokenHash,

                    Purpose =
                        UserTokenPurpose
                            .EmailConfirmation,

                    CreatedAt =
                        now,

                    ExpiresAt =
                        now.AddHours(24),

                    IsUsed =
                        false
                };


            await _userTokenRepo
                .AddAsync(
                    newUserToken
                );


            await _userTokenRepo
                .SaveChangesAsync();


            // =========================
            // Email
            // =========================


            var emailBody = BuildConfirmationEmail(
                user.FirstName,
                verificationToken
            );



            await _emailService
                .SendEmailAsync(
                    user.Email,
                    "New CrestMark Academy confirmation token",
                    emailBody
                );
        }


        // =========================
        // Forgot Password
        // =========================

        public async Task ForgotPasswordAsync(
            ForgotPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(
                    dto.Email))
            {
                return;
            }


            var email =
                dto.Email
                    .Trim()
                    .ToLowerInvariant();


            var user =
                await _userRepo
                    .FirstOrDefaultAsync(
                        u =>
                            u.Email ==
                            email
                    );


            // Generic response behavior.
            if (user == null ||
                !user.IsActive)
            {
                return;
            }


            var now =
                DateTime.UtcNow;


            // =========================
            // Invalidate Old Tokens
            // =========================

            var oldTokens =
                await _userTokenRepo
                    .FindAsync(
                        ut =>
                            ut.UserId ==
                                user.Id &&
                            ut.Purpose ==
                                UserTokenPurpose
                                    .PasswordReset &&
                            !ut.IsUsed
                    );


            foreach (var oldToken
                     in oldTokens)
            {
                oldToken.IsUsed =
                    true;

                oldToken.UsedAt =
                    now;


                _userTokenRepo.Update(
                    oldToken
                );
            }


            // =========================
            // New Reset Token
            // =========================

            var resetToken =
                _tokenService
                    .GenerateVerificationToken();


            var resetTokenHash =
                _tokenService
                    .HashToken(
                        resetToken
                    );


            var passwordResetToken =
                new UserToken
                {
                    UserId =
                        user.Id,

                    TokenHash =
                        resetTokenHash,

                    Purpose =
                        UserTokenPurpose
                            .PasswordReset,

                    CreatedAt =
                        now,

                    ExpiresAt =
                        now.AddMinutes(30),

                    IsUsed =
                        false
                };


            await _userTokenRepo
                .AddAsync(
                    passwordResetToken
                );


            await _userTokenRepo
                .SaveChangesAsync();


            // =========================
            // Reset Link
            // =========================

            var resetLink =
                $"https://crestmarkacademy.com/reset-password?token={Uri.EscapeDataString(resetToken)}";


            var emailBody = $"""
                <div style="font-family: Arial, sans-serif;">

                    <h2>Reset your password</h2>

                    <p>Hello {user.FirstName},</p>

                    <p>
                        We received a request to reset your
                        CrestMark Academy password.
                    </p>

                    <p style="margin: 30px 0;">
                        <a href="{resetLink}"
                           style="
                                background-color: #111827;
                                color: white;
                                padding: 12px 24px;
                                text-decoration: none;
                                border-radius: 6px;
                                font-weight: bold;
                           ">
                            Reset Password
                        </a>
                    </p>

                    <p>
                        This link expires in 30 minutes.
                    </p>

                    <p>
                        If you did not request a password reset,
                        you can ignore this email.
                    </p>

                    <p>
                        CrestMark Academy
                    </p>

                </div>
                """;


            await _emailService
                .SendEmailAsync(
                    user.Email,
                    "Reset your CrestMark Academy password",
                    emailBody
                );
        }


        // =========================
        // Reset Password
        // =========================

        public async Task ResetPasswordAsync(
            ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(
                    dto.Token))
            {
                throw new InvalidOperationException(
                    "Invalid or expired password reset token."
                );
            }


            var tokenHash =
                _tokenService
                    .HashToken(
                        dto.Token.Trim()
                    );


            var userToken =
                await _userTokenRepo
                    .FirstOrDefaultAsync(
                        ut =>
                            ut.TokenHash ==
                                tokenHash &&
                            ut.Purpose ==
                                UserTokenPurpose
                                    .PasswordReset
                    );


            var now =
                DateTime.UtcNow;


            if (userToken == null ||
                userToken.IsUsed ||
                userToken.ExpiresAt <= now)
            {
                throw new InvalidOperationException(
                    "Invalid or expired password reset token."
                );
            }


            var user =
                await _userRepo
                    .GetByIdAsync(
                        userToken.UserId
                    );


            if (user == null ||
                !user.IsActive)
            {
                throw new InvalidOperationException(
                    "Invalid or expired password reset token."
                );
            }


            // =========================
            // Prevent Same Password
            // =========================

            var currentPasswordResult =
                _passwordHasher
                    .VerifyHashedPassword(
                        user,
                        user.PasswordHash,
                        dto.NewPassword
                    );


            if (currentPasswordResult !=
                PasswordVerificationResult.Failed)
            {
                throw new InvalidOperationException(
                    "The new password must be different from the current password."
                );
            }


            // =========================
            // New Password
            // =========================

            user.PasswordHash =
                _passwordHasher
                    .HashPassword(
                        user,
                        dto.NewPassword
                    );


            user.UpdatedAt =
                now;


            _userRepo.Update(
                user
            );


            // =========================
            // Consume Reset Token
            // =========================

            userToken.IsUsed =
                true;

            userToken.UsedAt =
                now;


            _userTokenRepo.Update(
                userToken
            );


            // =========================
            // Invalidate Other
            // Reset Tokens
            // =========================

            var otherResetTokens =
                await _userTokenRepo
                    .FindAsync(
                        ut =>
                            ut.UserId ==
                                user.Id &&
                            ut.Purpose ==
                                UserTokenPurpose
                                    .PasswordReset &&
                            !ut.IsUsed &&
                            ut.Id !=
                                userToken.Id
                    );


            foreach (var token
                     in otherResetTokens)
            {
                token.IsUsed =
                    true;

                token.UsedAt =
                    now;


                _userTokenRepo.Update(
                    token
                );
            }


            // Password changed:
            // sign out every existing session.

            await RevokeAllRefreshTokensAsync(
                user.Id,
                now
            );


            await _userRepo
                .SaveChangesAsync();
        }


        // =========================
        // Change Password
        // =========================

        public async Task ChangePasswordAsync(
            int userId,
            ChangePasswordDto dto)
        {
            var user =
                await _userRepo
                    .GetByIdAsync(
                        userId
                    );


            if (user == null ||
                !user.IsActive)
            {
                throw new UnauthorizedAccessException(
                    "User account is not available."
                );
            }


            // =========================
            // Current Password
            // =========================

            var currentPasswordResult =
                _passwordHasher
                    .VerifyHashedPassword(
                        user,
                        user.PasswordHash,
                        dto.OldPassword
                    );


            if (currentPasswordResult ==
                PasswordVerificationResult.Failed)
            {
                throw new InvalidOperationException(
                    "Current password is incorrect."
                );
            }


            // =========================
            // Prevent Same Password
            // =========================

            var newPasswordResult =
                _passwordHasher
                    .VerifyHashedPassword(
                        user,
                        user.PasswordHash,
                        dto.NewPassword
                    );


            if (newPasswordResult !=
                PasswordVerificationResult.Failed)
            {
                throw new InvalidOperationException(
                    "The new password must be different from the current password."
                );
            }


            var now =
                DateTime.UtcNow;


            // =========================
            // New Password
            // =========================

            user.PasswordHash =
                _passwordHasher
                    .HashPassword(
                        user,
                        dto.NewPassword
                    );


            user.UpdatedAt =
                now;


            _userRepo.Update(
                user
            );


            // Changing password invalidates
            // every existing refresh token.

            await RevokeAllRefreshTokensAsync(
                user.Id,
                now
            );


            await _userRepo
                .SaveChangesAsync();
        }


        // =========================
        // Get User Roles
        // =========================

        private async Task<List<string>>
            GetUserRolesAsync(
                int userId)
        {
            var userRoles =
                await _userRoleRepo
                    .FindAsync(
                        ur =>
                            ur.UserId ==
                            userId
                    );


            var roles =
                new List<string>();


            foreach (var userRole
                     in userRoles)
            {
                var role =
                    await _roleRepo
                        .GetByIdAsync(
                            userRole.RoleId
                        );


                if (role != null &&
                    !string.IsNullOrWhiteSpace(
                        role.Name))
                {
                    roles.Add(
                        role.Name
                    );
                }
            }


            return roles;
        }


        // =========================
        // Revoke All Refresh Tokens
        // =========================

        private async Task
            RevokeAllRefreshTokensAsync(
                int userId,
                DateTime revokedAt)
        {
            var refreshTokens =
                await _refreshTokenRepo
                    .FindAsync(
                        rt =>
                            rt.UserId ==
                                userId &&
                            !rt.IsRevoked
                    );


            foreach (var refreshToken
                     in refreshTokens)
            {
                refreshToken.IsRevoked =
                    true;

                refreshToken.RevokedAt =
                    revokedAt;


                _refreshTokenRepo.Update(
                    refreshToken
                );
            }
        }

        private static string BuildConfirmationEmail(
            string firstName,
            string verificationToken)
        {
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
                    out var parsedUrl) ||
                (parsedUrl.Scheme != Uri.UriSchemeHttps &&
                 !(parsedUrl.Scheme == Uri.UriSchemeHttp &&
                   parsedUrl.IsLoopback)))
            {
                throw new InvalidOperationException(
                    "Invalid CrestMark client URL configuration."
                );
            }

            var verificationLink =
                $"{clientUrl}/en/verify-email" +
                $"?token={Uri.EscapeDataString(verificationToken)}";

            var safeLink = HtmlEncoder.Default.Encode(
                verificationLink
            );

            var safeName = HtmlEncoder.Default.Encode(
                firstName
            );

            return $"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport"
                  content="width=device-width, initial-scale=1.0">
            <title>Verify your email</title>
        </head>

        <body style="
            margin:0;
            padding:32px 16px;
            background-color:#f3f7fc;
            font-family:Arial,Helvetica,sans-serif;
            color:#172f50;
        ">

            <table role="presentation"
                   cellspacing="0"
                   cellpadding="0"
                   border="0"
                   width="100%"
                   style="max-width:560px;margin:0 auto;">

                <tr>
                    <td style="
                        background-color:#102a52;
                        padding:25px 32px;
                        border-radius:12px 12px 0 0;
                    ">
                        <span style="
                            color:#ffffff;
                            font-size:23px;
                            font-weight:700;
                            letter-spacing:-0.5px;
                        ">
                            CrestMark
                        </span>

                        <span style="
                            display:block;
                            color:#a9c9ee;
                            font-size:11px;
                            margin-top:4px;
                            letter-spacing:1.5px;
                        ">
                            ACADEMY
                        </span>
                    </td>
                </tr>

                <tr>
                    <td style="
                        background-color:#ffffff;
                        padding:42px 34px;
                        border:1px solid #e2eaf4;
                    ">

                        <h1 style="
                            margin:0 0 20px;
                            color:#102a52;
                            font-size:28px;
                            line-height:1.3;
                        ">
                            Verify your email address
                        </h1>

                        <p style="
                            margin:0 0 15px;
                            color:#445c78;
                            font-size:15px;
                            line-height:1.8;
                        ">
                            Hi {safeName},
                        </p>

                        <p style="
                            margin:0;
                            color:#5b7089;
                            font-size:15px;
                            line-height:1.8;
                        ">
                            Welcome to CrestMark Academy!
                            Please confirm your email address
                            to activate your account and begin
                            your learning journey.
                        </p>

                        <table role="presentation"
                               cellspacing="0"
                               cellpadding="0"
                               border="0"
                               style="margin:32px 0;">
                            <tr>
                                <td style="
                                    background-color:#2563eb;
                                    border-radius:8px;
                                ">
                                    <a href="{safeLink}"
                                       style="
                                           display:inline-block;
                                           padding:16px 28px;
                                           background-color:#2563eb;
                                           color:#ffffff;
                                           font-size:15px;
                                           font-weight:700;
                                           text-decoration:none;
                                           border-radius:8px;
                                       ">
                                        Verify Email Address
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <p style="
                            color:#74859b;
                            font-size:13px;
                            line-height:1.8;
                            margin:0 0 18px;
                        ">
                            This verification link expires
                            in 24 hours.
                        </p>

                        <p style="
                            color:#74859b;
                            font-size:13px;
                            line-height:1.8;
                            margin:0;
                        ">
                            If the button doesn't work,
                            copy and paste this link
                            into your browser:
                        </p>

                        <p style="
                            font-size:12px;
                            line-height:1.8;
                            overflow-wrap:anywhere;
                            word-break:break-all;
                        ">
                            <a href="{safeLink}"
                               style="color:#2563eb;">
                                {safeLink}
                            </a>
                        </p>

                        <p style="
                            margin:25px 0 0;
                            color:#8593a6;
                            font-size:12px;
                            line-height:1.7;
                        ">
                            If you didn't create this account,
                            you can safely ignore this email.
                        </p>
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:24px 16px;
                        text-align:center;
                        background-color:#edf3fa;
                        border-radius:0 0 12px 12px;
                        color:#71839b;
                        font-size:12px;
                    ">
                        CrestMark Academy
                        <br>
                        Learn. Build. Advance.
                    </td>
                </tr>

            </table>
        </body>
        </html>
        """;
        }

    }
}