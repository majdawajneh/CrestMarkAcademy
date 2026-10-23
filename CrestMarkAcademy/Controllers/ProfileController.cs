
using Application.Dto_s.Profile;
using Application.Services.Interfaces;
using Domain.Entities.Identity;
using Infrastructure.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/profile")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private const long MaxImageSize = 2 * 1024 * 1024;

        private readonly IProfileService _profileService;
        private readonly CrestMark_DbContext _db;
        private readonly IWebHostEnvironment _environment;

        public ProfileController(
            IProfileService profileService,
            CrestMark_DbContext db,
            IWebHostEnvironment environment)
        {
            _profileService = profileService;
            _db = db;
            _environment = environment;
        }

        [HttpGet]
        public async Task<ActionResult<ProfileDto>> GetMyProfile()
        {
            var userId = GetCurrentUserId();

            return Ok(
                await _profileService.GetMyProfileAsync(userId)
            );
        }

        [HttpPut]
        public async Task<ActionResult<ProfileDto>> UpdateMyProfile(
            UpdateProfileDto dto)
        {
            var userId = GetCurrentUserId();

            return Ok(
                await _profileService.UpdateMyProfileAsync(userId, dto)
            );
        }

        // ========================================
        // Update My Instructor Profile
        // PUT /api/profile/instructor
        // ========================================

        [HttpPut("instructor")]
        [Authorize(Roles = "Instructor")]
        public async Task<ActionResult<ProfileDto>>
            UpdateInstructorProfile(
                [FromBody] UpdateInstructorProfileDto dto)
        {
            var userId = GetCurrentUserId();

            var profile = await _profileService
                .UpdateInstructorProfileAsync(userId, dto);

            return Ok(profile);
        }

        // =====================================
        // Get Profile Image
        // =====================================

        [HttpGet("image")]
        public async Task<IActionResult> GetImage()
        {
            var userId = GetCurrentUserId();

            var profile = await _db.UserProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null ||
                string.IsNullOrWhiteSpace(profile.ProfileImageUrl) ||
                !IsManagedImage(profile.ProfileImageUrl))
            {
                return NotFound();
            }

            var path = GetImagePath(profile.ProfileImageUrl);

            if (!System.IO.File.Exists(path))
            {
                return NotFound();
            }

            var contentType = GetContentType(path);

            if (contentType == null)
            {
                return NotFound();
            }

            Response.Headers.CacheControl = "private, no-store";

            return PhysicalFile(path, contentType);
        }

        // =====================================
        // Upload / Replace Image
        // =====================================

        [HttpPost("image")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(3 * 1024 * 1024)]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            var userId = GetCurrentUserId();

            if (file == null ||
                file.Length == 0 ||
                file.Length > MaxImageSize)
            {
                return BadRequest(new
                {
                    message = "Image must be smaller than 2MB."
                });
            }

            var extension = Path.GetExtension(file.FileName)
                .ToLowerInvariant();

            if (extension != ".jpg" &&
                extension != ".jpeg" &&
                extension != ".png" &&
                extension != ".webp")
            {
                return BadRequest(new
                {
                    message = "Only JPG, PNG and WebP are supported."
                });
            }

            // Read a bounded amount of data.
            byte[] bytes;

            await using (var stream = file.OpenReadStream())
            {
                using var memory = new MemoryStream();
                await stream.CopyToAsync(memory);
                bytes = memory.ToArray();
            }

            if (bytes.LongLength > MaxImageSize ||
                !IsSupportedImage(bytes, extension))
            {
                return BadRequest(new
                {
                    message = "Invalid image format."
                });
            }

            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User was not found."
                });
            }

            var profile = await _db.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
            {
                profile = new UserProfile
                {
                    UserId = userId
                };

                _db.UserProfiles.Add(profile);
            }

            var oldImage = profile.ProfileImageUrl;

            var normalizedExtension =
                extension == ".jpeg" ? ".jpg" : extension;

            var filename =
                $"{Guid.NewGuid():N}{normalizedExtension}";

            var directory = GetImageDirectory();
            Directory.CreateDirectory(directory);

            var newPath = Path.Combine(directory, filename);

            try
            {
                await System.IO.File.WriteAllBytesAsync(
                    newPath,
                    bytes,
                    HttpContext.RequestAborted
                );

                profile.ProfileImageUrl = filename;

                await _db.SaveChangesAsync(
                    HttpContext.RequestAborted
                );
            }
            catch
            {
                if (System.IO.File.Exists(newPath))
                {
                    System.IO.File.Delete(newPath);
                }

                throw;
            }

            // Remove the previous managed file only after
            // the database update succeeds.
            DeleteManagedImage(oldImage);

            return Ok(new
            {
                profileImageUrl = "/api/profile/image"
            });
        }

        // =====================================
        // Delete Image
        // =====================================

        [HttpDelete("image")]
        public async Task<IActionResult> DeleteImage()
        {
            var userId = GetCurrentUserId();

            var profile = await _db.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null ||
                string.IsNullOrWhiteSpace(profile.ProfileImageUrl))
            {
                return NoContent();
            }

            var oldImage = profile.ProfileImageUrl;

            profile.ProfileImageUrl = null;

            await _db.SaveChangesAsync(
                HttpContext.RequestAborted
            );

            DeleteManagedImage(oldImage);

            return NoContent();
        }

        // =====================================
        // File Helpers
        // =====================================

        private string GetImageDirectory()
        {
            return Path.Combine(
                _environment.ContentRootPath,
                "profile-images"
            );
        }

        private string GetImagePath(string filename)
        {
            return Path.Combine(
                GetImageDirectory(),
                filename
            );
        }

        private static bool IsManagedImage(string? filename)
        {
            if (string.IsNullOrWhiteSpace(filename))
                return false;

            if (filename.Length != 32 + Path.GetExtension(filename).Length)
                return false;

            var extension = Path.GetExtension(filename);

            if (extension != ".jpg" &&
                extension != ".png" &&
                extension != ".webp")
            {
                return false;
            }

            var name = Path.GetFileNameWithoutExtension(filename);

            return name.Length == 32 &&
                name.All(Uri.IsHexDigit);
        }

        private void DeleteManagedImage(string? filename)
        {
            if (!IsManagedImage(filename))
                return;

            var path = GetImagePath(filename!);

            if (System.IO.File.Exists(path))
            {
                System.IO.File.Delete(path);
            }
        }

        private static string? GetContentType(string path)
        {
            return Path.GetExtension(path).ToLowerInvariant() switch
            {
                ".jpg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                _ => null
            };
        }

        private static bool IsSupportedImage(
            byte[] bytes,
            string extension)
        {
            var data = bytes.AsSpan();

            if (extension is ".jpg" or ".jpeg")
            {
                return data.Length >= 4 &&
                    data[0] == 0xFF &&
                    data[1] == 0xD8 &&
                    data[^2] == 0xFF &&
                    data[^1] == 0xD9;
            }

            if (extension == ".png")
            {
                return data.Length >= 24 &&
                    data[..8].SequenceEqual(
                        new byte[]
                        {
                            137, 80, 78, 71,
                            13, 10, 26, 10
                        });
            }

            if (extension == ".webp")
            {
                return data.Length >= 12 &&
                    data[..4].SequenceEqual("RIFF"u8) &&
                    data.Slice(8, 4).SequenceEqual("WEBP"u8);
            }

            return false;
        }

        // =====================================
        // Current User
        // =====================================

        private int GetCurrentUserId()
        {
            var value = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            if (!int.TryParse(value, out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Invalid user token."
                );
            }

            return userId;
        }
    }
}
