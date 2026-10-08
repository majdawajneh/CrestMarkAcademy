using Application.Dto_s.Auth;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Identity;
using Domain.Entities.Identity__UserManagement_;
using Domain.Enums;
using Microsoft.AspNetCore.Identity;

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

            var emailBody = $"""
                <div style="font-family: Arial, sans-serif;">
                    <h2>Welcome to CrestMark Academy</h2>

                    <p>Hello {user.FirstName},</p>

                    <p>
                        Thank you for creating your account.
                    </p>

                    <p>
                        Please use the following verification token
                        to confirm your email:
                    </p>

                    <div style="
                        padding: 15px;
                        background-color: #f3f3f3;
                        margin: 20px 0;
                        font-size: 18px;
                        font-weight: bold;
                        word-break: break-all;
                    ">
                        {verificationToken}
                    </div>

                    <p>
                        This verification token expires in 24 hours.
                    </p>

                    <p>
                        CrestMark Academy
                    </p>
                </div>
                """;


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

            var emailBody = $"""
                <div style="font-family: Arial, sans-serif;">

                    <h2>CrestMark Academy</h2>

                    <p>Hello {user.FirstName},</p>

                    <p>
                        We received a request to send you
                        a new email confirmation token.
                    </p>

                    <p>
                        Use the verification token below:
                    </p>

                    <div style="
                        padding: 15px;
                        background-color: #f3f3f3;
                        margin: 20px 0;
                        font-size: 18px;
                        font-weight: bold;
                        word-break: break-all;
                    ">
                        {verificationToken}
                    </div>

                    <p>
                        This token expires in 24 hours.
                    </p>

                    <p>
                        CrestMark Academy
                    </p>

                </div>
                """;


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
    }
}