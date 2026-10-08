using Application.Dto_s.User;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Identity;
using Domain.Entities.Identity__UserManagement_;

namespace Application.Services
{
    public class AdminUserService
        : IAdminUserService
    {
        private readonly IUserRepository
            _userDetailsRepo;

        private readonly IGenericRepository<User>
            _userRepo;

        private readonly IGenericRepository<RefreshToken>
            _refreshTokenRepo;


        public AdminUserService(
            IUserRepository userDetailsRepo,
            IGenericRepository<User> userRepo,
            IGenericRepository<RefreshToken> refreshTokenRepo)
        {
            _userDetailsRepo =
                userDetailsRepo;

            _userRepo =
                userRepo;

            _refreshTokenRepo =
                refreshTokenRepo;
        }


        // =========================
        // Get All
        // =========================

        public async Task<
            IEnumerable<AdminUserListDto>>
            GetAllAsync()
        {
            var users =
                await _userDetailsRepo
                    .GetAllWithDetailsAsync();


            return users
                .Select(MapToListDto)
                .ToList();
        }


        // =========================
        // Get By Id
        // =========================

        public async Task<AdminUserDetailsDto>
            GetByIdAsync(
                int id)
        {
            var user =
                await _userDetailsRepo
                    .GetByIdWithDetailsAsync(
                        id
                    );


            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }


            return MapToDetailsDto(
                user
            );
        }


        // =========================
        // Deactivate
        // =========================

        public async Task
            DeactivateAsync(
                int currentAdminUserId,
                int userId)
        {
            // =========================
            // Prevent Self Deactivation
            // =========================

            if (currentAdminUserId ==
                userId)
            {
                throw new InvalidOperationException(
                    "You cannot deactivate your own account."
                );
            }


            // =========================
            // Get User
            // =========================

            var user =
                await _userDetailsRepo
                    .GetByIdWithDetailsAsync(
                        userId
                    );


            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }


            // Idempotent
            if (!user.IsActive)
            {
                return;
            }


            // =========================
            // Protect Admin Accounts
            // =========================

            var isAdmin =
                user.UserRoles.Any(
                    ur =>
                        string.Equals(
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


            var now =
                DateTime.UtcNow;


            // =========================
            // Deactivate User
            // =========================

            user.IsActive =
                false;

            user.UpdatedAt =
                now;


            _userRepo.Update(
                user
            );


            // =========================
            // Revoke Refresh Tokens
            // =========================

            var refreshTokens =
                await _refreshTokenRepo
                    .FindAsync(
                        rt =>
                            rt.UserId ==
                                user.Id &&
                            !rt.IsRevoked
                    );


            foreach (var refreshToken
                     in refreshTokens)
            {
                refreshToken.IsRevoked =
                    true;

                refreshToken.RevokedAt =
                    now;


                _refreshTokenRepo.Update(
                    refreshToken
                );
            }


            // User + Refresh Tokens
            // use the same scoped DbContext.

            await _userRepo
                .SaveChangesAsync();
        }


        // =========================
        // Activate
        // =========================

        public async Task
            ActivateAsync(
                int userId)
        {
            var user =
                await _userRepo
                    .GetByIdAsync(
                        userId
                    );


            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }


            // Idempotent
            if (user.IsActive)
            {
                return;
            }


            user.IsActive =
                true;

            user.UpdatedAt =
                DateTime.UtcNow;


            _userRepo.Update(
                user
            );


            await _userRepo
                .SaveChangesAsync();
        }


        // =========================
        // Map List
        // =========================

        private static AdminUserListDto
            MapToListDto(
                User user)
        {
            return new AdminUserListDto
            {
                Id =
                    user.Id,

                FirstName =
                    user.FirstName,

                LastName =
                    user.LastName,

                Username =
                    user.Username,

                Email =
                    user.Email,

                IsActive =
                    user.IsActive,

                EmailConfirmed =
                    user.EmailConfirmed,

                Roles =
                    user.UserRoles
                        .Select(
                            ur =>
                                ur.Role.Name
                        )
                        .ToList(),

                CreatedAt =
                    user.CreatedAt
            };
        }


        // =========================
        // Map Details
        // =========================

        private static AdminUserDetailsDto
            MapToDetailsDto(
                User user)
        {
            return new AdminUserDetailsDto
            {
                Id =
                    user.Id,

                FirstName =
                    user.FirstName,

                LastName =
                    user.LastName,

                Username =
                    user.Username,

                Email =
                    user.Email,

                IsActive =
                    user.IsActive,

                EmailConfirmed =
                    user.EmailConfirmed,

                Roles =
                    user.UserRoles
                        .Select(
                            ur =>
                                ur.Role.Name
                        )
                        .ToList(),

                ProfileImageUrl =
                    user.UserProfile?
                        .ProfileImageUrl,

                Bio =
                    user.UserProfile?
                        .Bio,

                PhoneNumber =
                    user.UserProfile?
                        .PhoneNumber,

                Country =
                    user.UserProfile?
                        .Country,

                DateOfBirth =
                    user.UserProfile?
                        .DateOfBirth,

                CreatedAt =
                    user.CreatedAt,

                UpdatedAt =
                    user.UpdatedAt
            };
        }
    }
}