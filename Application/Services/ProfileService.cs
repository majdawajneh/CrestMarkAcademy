using Application.Dto_s.Profile;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Identity;

namespace Application.Services
{
    public class ProfileService
        : IProfileService
    {
        private readonly
            IGenericRepository<User>
            _userRepo;

        private readonly
            IGenericRepository<UserProfile>
            _profileRepo;


        public ProfileService(
            IGenericRepository<User> userRepo,
            IGenericRepository<UserProfile> profileRepo)
        {
            _userRepo =
                userRepo;

            _profileRepo =
                profileRepo;
        }


        // =========================
        // Get My Profile
        // =========================

        public async Task<ProfileDto>
            GetMyProfileAsync(
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


            var profile =
                await _profileRepo
                    .FirstOrDefaultAsync(
                        p =>
                            p.UserId ==
                            userId
                    );


            return MapToDto(
                user,
                profile
            );
        }


        // =========================
        // Update My Profile
        // =========================

        public async Task<ProfileDto>
            UpdateMyProfileAsync(
                int userId,
                UpdateProfileDto dto)
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


            // =========================
            // Validate
            // =========================

            if (string.IsNullOrWhiteSpace(
                    dto.FirstName))
            {
                throw new ArgumentException(
                    "First name is required."
                );
            }


            if (string.IsNullOrWhiteSpace(
                    dto.LastName))
            {
                throw new ArgumentException(
                    "Last name is required."
                );
            }


            if (dto.DateOfBirth.HasValue &&
                dto.DateOfBirth.Value.Date >
                DateTime.UtcNow.Date)
            {
                throw new ArgumentException(
                    "Date of birth cannot be in the future."
                );
            }


            // =========================
            // Update User
            // =========================

            user.FirstName =
                dto.FirstName.Trim();

            user.LastName =
                dto.LastName.Trim();

            user.UpdatedAt =
                DateTime.UtcNow;


            _userRepo.Update(
                user
            );


            // =========================
            // Get / Create Profile
            // =========================

            var profile =
                await _profileRepo
                    .FirstOrDefaultAsync(
                        p =>
                            p.UserId ==
                            userId
                    );


            if (profile == null)
            {
                profile =
                    new UserProfile
                    {
                        UserId =
                            userId
                    };


                await _profileRepo
                    .AddAsync(
                        profile
                    );
            }


            // =========================
            // Update Profile
            // =========================

            profile.ProfileImageUrl =
                NormalizeOptional(
                    dto.ProfileImageUrl
                );

            profile.Bio =
                NormalizeOptional(
                    dto.Bio
                );

            profile.PhoneNumber =
                NormalizeOptional(
                    dto.PhoneNumber
                );

            profile.Country =
                NormalizeOptional(
                    dto.Country
                );

            profile.DateOfBirth =
                dto.DateOfBirth;


            if (profile.Id != 0)
            {
                _profileRepo.Update(
                    profile
                );
            }


            // Both repositories use
            // the same scoped DbContext.

            await _userRepo
                .SaveChangesAsync();


            return MapToDto(
                user,
                profile
            );
        }


        // =========================
        // Normalize Optional Text
        // =========================

        private static string?
            NormalizeOptional(
                string? value)
        {
            if (string.IsNullOrWhiteSpace(
                    value))
            {
                return null;
            }


            return value.Trim();
        }


        // =========================
        // Mapping
        // =========================

        private static ProfileDto
            MapToDto(
                User user,
                UserProfile? profile)
        {
            return new ProfileDto
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

                EmailConfirmed =
                    user.EmailConfirmed,

                ProfileImageUrl =
                    profile?.ProfileImageUrl,

                Bio =
                    profile?.Bio,

                PhoneNumber =
                    profile?.PhoneNumber,

                Country =
                    profile?.Country,

                DateOfBirth =
                    profile?.DateOfBirth,

                CreatedAt =
                    user.CreatedAt
            };
        }
    }
}