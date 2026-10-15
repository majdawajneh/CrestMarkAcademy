
using Application.Dto_s.User;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using Domain.Entities.Identity;
using Domain.Entities.Identity__UserManagement_;

namespace Application.Services
{
    public class AdminUserService : IAdminUserService
    {
        private readonly IUserRepository _userDetailsRepo;
        private readonly IGenericRepository<User> _userRepo;
        private readonly IGenericRepository<RefreshToken> _refreshTokenRepo;

        private readonly IGenericRepository<Role> _roleRepo;
        private readonly IGenericRepository<UserRole> _userRoleRepo;
        private readonly IGenericRepository<Course> _courseRepo;

        public AdminUserService(
            IUserRepository userDetailsRepo,
            IGenericRepository<User> userRepo,
            IGenericRepository<RefreshToken> refreshTokenRepo,
            IGenericRepository<Role> roleRepo,
            IGenericRepository<UserRole> userRoleRepo,
            IGenericRepository<Course> courseRepo)
        {
            _userDetailsRepo = userDetailsRepo;
            _userRepo = userRepo;
            _refreshTokenRepo = refreshTokenRepo;

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
