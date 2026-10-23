
using Domain.Entities.Catalog;
using Domain.Entities.Engagement;
using Domain.Entities.Identity;
using Domain.Entities.Identity__UserManagement_;
using Domain.Entities.Learning;
using Infrastructure.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/instructors")]
    [AllowAnonymous]
    public class InstructorsController : ControllerBase
    {
        private readonly CrestMark_DbContext _db;
        private readonly IWebHostEnvironment _environment;

        public InstructorsController(
            CrestMark_DbContext db,
            IWebHostEnvironment environment)
        {
            _db = db;
            _environment = environment;
        }

        // ========================================
        // Public Instructor Profile
        // GET /api/instructors/{id}
        // ========================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0)
                return NotFound();

            var instructor = await _db.Set<User>()
                .AsNoTracking()
                .Where(u =>
                    u.Id == id &&
                    u.IsActive &&
                    u.EmailConfirmed &&
                    u.UserRoles.Any(ur =>
                        ur.Role.Name == "Instructor"))
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Username,
                    Profile = u.UserProfile
                })
                .FirstOrDefaultAsync();

            if (instructor == null)
                return NotFound();

            // Published courses only.
            var courses = await _db.Set<Course>()
                .AsNoTracking()
                .Where(c =>
                    c.InstructorId == id &&
                    c.Status == "Published")
                .OrderByDescending(c => c.PublishedAt)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Slug,
                    c.ShortDescription,
                    c.ThumbnailUrl,
                    c.Price,
                    c.DiscountPrice,
                    c.Language,
                    c.Level,
                    c.EstimatedDurationHours,

                    StudentsCount = c.Enrollments.Count(),

                    ReviewsCount = c.Reviews.Count(),

                    AverageRating = c.Reviews.Any()
                        ? c.Reviews.Average(r => (double?)r.Rating)
                        : null
                })
                .ToListAsync();

            var courseIds = courses
                .Select(c => c.Id)
                .ToList();

            // Unique students across published courses.
            var studentsCount = await _db.Set<Enrollment>()
                .AsNoTracking()
                .Where(e => courseIds.Contains(e.CourseId))
                .Select(e => e.UserId)
                .Distinct()
                .CountAsync();

            var reviewsQuery = _db.Set<Review>()
                .AsNoTracking()
                .Where(r => courseIds.Contains(r.CourseId));

            var reviewsCount = await reviewsQuery.CountAsync();

            var averageRating = await reviewsQuery
                .AverageAsync(r => (double?)r.Rating);

            // Recent reviews from published courses only.
            var recentReviews = await reviewsQuery
                .OrderByDescending(r => r.CreatedAt)
                .Take(6)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Comment,
                    r.CreatedAt,
                    CourseTitle = r.Course.Title,
                    StudentFirstName = r.User.FirstName,
                    StudentLastName = r.User.LastName
                })
                .ToListAsync();

            var reviews = recentReviews.Select(r => new
            {
                r.Id,
                r.Rating,
                r.Comment,
                r.CreatedAt,
                r.CourseTitle,
                StudentName = string.IsNullOrWhiteSpace(r.StudentLastName)
                    ? r.StudentFirstName
                    : $"{r.StudentFirstName} {r.StudentLastName[0]}."
            });

            var response = new
            {
                instructorId = instructor.Id,

                instructor.FirstName,
                instructor.LastName,
                instructor.Username,

                profileImageUrl =
                    instructor.Profile?.ProfileImageUrl == null
                        ? null
                        : $"/api/instructors/{id}/image",

                bio = instructor.Profile?.Bio,
                country = instructor.Profile?.Country,
                professionalTitle =
                    instructor.Profile?.ProfessionalTitle,
                expertise = instructor.Profile?.Expertise,
                experience = instructor.Profile?.Experience,

                linkedInUrl = instructor.Profile?.LinkedInUrl,
                gitHubUrl = instructor.Profile?.GitHubUrl,
                websiteUrl = instructor.Profile?.WebsiteUrl,
                youTubeUrl = instructor.Profile?.YouTubeUrl,

                statistics = new
                {
                    coursesCount = courses.Count,
                    studentsCount,
                    reviewsCount,
                    averageRating = averageRating.HasValue
                        ? Math.Round(averageRating.Value, 1)
                        : (double?)null
                },

                courses,
                reviews
            };

            return Ok(response);
        }

        // ========================================
        // Public Instructor Profile Image
        // GET /api/instructors/{id}/image
        // ========================================

        [HttpGet("{id:int}/image")]
        public async Task<IActionResult> GetImage(int id)
        {
            var filename = await _db.Set<User>()
                .AsNoTracking()
                .Where(u =>
                    u.Id == id &&
                    u.IsActive &&
                    u.EmailConfirmed &&
                    u.UserRoles.Any(ur =>
                        ur.Role.Name == "Instructor"))
                .Select(u => u.UserProfile != null
                    ? u.UserProfile.ProfileImageUrl
                    : null)
                .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(filename))
                return NotFound();

            var extension = Path.GetExtension(filename);
            var name = Path.GetFileNameWithoutExtension(filename);

            // Only serve files created by the managed
            // profile-image upload system.
            if (name.Length != 32 ||
                !name.All(Uri.IsHexDigit) ||
                !new[] { ".jpg", ".png", ".webp" }
                    .Contains(extension))
            {
                return NotFound();
            }

            var path = Path.Combine(
                _environment.ContentRootPath,
                "profile-images",
                filename
            );

            if (!System.IO.File.Exists(path))
                return NotFound();

            var contentType = extension switch
            {
                ".jpg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                _ => null
            };

            if (contentType == null)
                return NotFound();

            return PhysicalFile(path, contentType);
        }
    }
}
