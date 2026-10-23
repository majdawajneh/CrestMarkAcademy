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


        // ========================================
        // Update Instructor Professional Profile
        // ========================================

        public async Task<ProfileDto> UpdateInstructorProfileAsync(
            int userId,
            UpdateInstructorProfileDto dto)
        {
            var user = await _userRepo.GetByIdAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }

            if (!user.IsActive || !user.EmailConfirmed)
            {
                throw new InvalidOperationException(
                    "Instructor account is not active."
                );
            }

            var profile = await _profileRepo.FirstOrDefaultAsync(
                p => p.UserId == userId
            );

            if (profile == null)
            {
                profile = new UserProfile
                {
                    UserId = userId
                };

                await _profileRepo.AddAsync(profile);
            }

            // Validate professional information.
            var professionalTitle =
                NormalizeOptional(dto.ProfessionalTitle);

            var bio = NormalizeOptional(dto.Bio);
            var expertise = NormalizeOptional(dto.Expertise);
            var experience = NormalizeOptional(dto.Experience);

            if (professionalTitle?.Length > 150 ||
                bio?.Length > 1000 ||
                expertise?.Length > 1000 ||
                experience?.Length > 3000)
            {
                throw new ArgumentException(
                    "Instructor profile information exceeds the allowed length."
                );
            }

            // Only secure HTTPS social links are accepted.
            var linkedInUrl = NormalizeSecureUrl(dto.LinkedInUrl);
            var gitHubUrl = NormalizeSecureUrl(dto.GitHubUrl);
            var websiteUrl = NormalizeSecureUrl(dto.WebsiteUrl);
            var youTubeUrl = NormalizeSecureUrl(dto.YouTubeUrl);

            profile.ProfessionalTitle = professionalTitle;
            profile.Bio = bio;
            profile.Expertise = expertise;
            profile.Experience = experience;

            profile.LinkedInUrl = linkedInUrl;
            profile.GitHubUrl = gitHubUrl;
            profile.WebsiteUrl = websiteUrl;
            profile.YouTubeUrl = youTubeUrl;

            user.UpdatedAt = DateTime.UtcNow;

            _userRepo.Update(user);

            if (profile.Id != 0)
            {
                _profileRepo.Update(profile);
            }

            // Both repositories share the scoped DbContext.
            await _userRepo.SaveChangesAsync();

            return MapToDto(user, profile);
        }

        // ========================================
        // Validate Secure URLs
        // ========================================

        private static string? NormalizeSecureUrl(string? value)
        {
            var url = NormalizeOptional(value);

            if (url == null)
            {
                return null;
            }

            if (url.Length > 500 ||
                !Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
                uri.Scheme != Uri.UriSchemeHttps ||
                !string.IsNullOrEmpty(uri.UserInfo))
            {
                throw new ArgumentException(
                    "Social links must be valid HTTPS URLs with a maximum of 500 characters."
                );
            }

            return url;
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
                    user.CreatedAt,

                ProfessionalTitle = profile?.ProfessionalTitle,

                Expertise = profile?.Expertise,

                Experience = profile?.Experience,

                LinkedInUrl = profile?.LinkedInUrl,

                GitHubUrl = profile?.GitHubUrl,

                WebsiteUrl = profile?.WebsiteUrl,

                YouTubeUrl = profile?.YouTubeUrl,
            };
        }
    }
}