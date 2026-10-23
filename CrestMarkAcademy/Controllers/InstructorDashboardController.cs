
using Domain.Entities.Catalog;
using Domain.Entities.Engagement;
using Domain.Entities.Learning;
using Infrastructure.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/instructor")]
    [Authorize(Roles = "Instructor")]
    public class InstructorDashboardController : ControllerBase
    {
        private readonly CrestMark_DbContext _db;

        public InstructorDashboardController(
            CrestMark_DbContext db)
        {
            _db = db;
        }

        // ========================================
        // Instructor Dashboard Overview
        // GET /api/instructor/dashboard
        // ========================================

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var instructorId = GetCurrentUserId();

            var myCourses = _db.Set<Course>()
                .AsNoTracking()
                .Where(c => c.InstructorId == instructorId);

            var courseIds = myCourses.Select(c => c.Id);

            var enrollments = _db.Set<Enrollment>()
                .AsNoTracking()
                .Where(e => courseIds.Contains(e.CourseId));

            var reviews = _db.Set<Review>()
                .AsNoTracking()
                .Where(r => courseIds.Contains(r.CourseId));

            var totalCourses = await myCourses.CountAsync();

            var publishedCourses = await myCourses
                .CountAsync(c => c.Status == "Published");

            var draftCourses = await myCourses
                .CountAsync(c => c.Status == "Draft");

            var totalEnrollments = await enrollments.CountAsync();

            var uniqueStudents = await enrollments
                .Select(e => e.UserId)
                .Distinct()
                .CountAsync();

            var completedEnrollments = await enrollments
                .CountAsync(e => e.CompletedAt != null);

            var totalReviews = await reviews.CountAsync();

            var averageRating = await reviews
                .AverageAsync(r => (double?)r.Rating);

            return Ok(new
            {
                instructorId,

                statistics = new
                {
                    totalCourses,
                    publishedCourses,
                    draftCourses,
                    totalEnrollments,
                    uniqueStudents,
                    completedEnrollments,
                    totalReviews,
                    averageRating = averageRating.HasValue
                        ? Math.Round(averageRating.Value, 1)
                        : (double?)null
                }
            });
        }

        // ========================================
        // My Assigned Courses
        // GET /api/instructor/courses
        // ========================================

        [HttpGet("courses")]
        public async Task<IActionResult> GetMyCourses()
        {
            var instructorId = GetCurrentUserId();

            var courses = await _db.Set<Course>()
                .AsNoTracking()
                .Where(c => c.InstructorId == instructorId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Slug,
                    c.ShortDescription,
                    c.ThumbnailUrl,
                    c.Status,
                    c.Level,
                    c.Language,
                    c.EstimatedDurationHours,
                    c.CreatedAt,
                    c.PublishedAt,

                    studentsCount = c.Enrollments
                        .Select(e => e.UserId)
                        .Distinct()
                        .Count(),

                    enrollmentsCount = c.Enrollments.Count(),

                    completedEnrollments = c.Enrollments
                        .Count(e => e.CompletedAt != null),

                    reviewsCount = c.Reviews.Count(),

                    averageRating = c.Reviews
                        .Average(r => (double?)r.Rating)
                })
                .ToListAsync();

            return Ok(courses);
        }



        // ========================================
        // Instructor Course Reviews
        // GET /api/instructor/reviews
        // ========================================

        [HttpGet("reviews")]
        public async Task<IActionResult> GetMyReviews()
        {
            var instructorId = GetCurrentUserId();

            var reviews = await _db.Set<Review>()
                .AsNoTracking()
                .Where(r =>
                    r.Course.InstructorId == instructorId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.CourseId,
                    CourseTitle = r.Course.Title,
                    r.Rating,
                    r.Comment,
                    r.CreatedAt,
                    r.UpdatedAt,

                    StudentName =
                        r.User.FirstName + " " +
                        r.User.LastName
                })
                .ToListAsync();

            return Ok(reviews);
        }



        // ========================================
        // Students Progress By Course
        // GET /api/instructor/courses/{courseId}/students
        // ========================================

        [HttpGet("courses/{courseId:int}/students")]
        public async Task<IActionResult> GetCourseStudents(int courseId)
        {
            var instructorId = GetCurrentUserId();

            // Verify that this course belongs to the
            // currently authenticated instructor.
            var course = await _db.Set<Course>()
                .AsNoTracking()
                .Where(c =>
                    c.Id == courseId &&
                    c.InstructorId == instructorId)
                .Select(c => new
                {
                    c.Id,
                    c.Title
                })
                .FirstOrDefaultAsync();

            if (course == null)
            {
                return NotFound(new
                {
                    message = "Course was not found."
                });
            }

            // Count published lessons in this course.
            var totalLessons = await _db.Set<Lesson>()
                .AsNoTracking()
                .CountAsync(l =>
                    l.CourseSection.CourseId == courseId &&
                    l.IsPublished);

            // Load only enrollments belonging to this course.
            var students = await _db.Set<Enrollment>()
                .AsNoTracking()
                .Where(e => e.CourseId == courseId)
                .OrderByDescending(e => e.EnrolledAt)
                .Select(e => new
                {
                    e.Id,
                    e.UserId,

                    StudentName =
                        e.User.FirstName + " " +
                        e.User.LastName,

                    e.EnrolledAt,
                    e.CompletedAt,
                    e.Status,

                    CompletedLessons = e.LessonProgresses
                        .Where(lp =>
                            lp.IsCompleted &&
                            lp.Lesson.IsPublished &&
                            lp.Lesson.CourseSection.CourseId == courseId)
                        .Select(lp => lp.LessonId)
                        .Distinct()
                        .Count(),

                    LastActivityAt = e.LessonProgresses
                        .Select(lp => (DateTime?)lp.UpdatedAt)
                        .Max()
                })
                .ToListAsync();

            var results = students.Select(s =>
            {
                var completedLessons = Math.Min(
                    s.CompletedLessons,
                    totalLessons
                );

                var progressPercentage = totalLessons == 0
                    ? 0
                    : Math.Round(
                        (double)completedLessons / totalLessons * 100,
                        1
                    );

                return new
                {
                    enrollmentId = s.Id,
                    studentId = s.UserId,
                    studentName = s.StudentName,
                    s.EnrolledAt,
                    s.CompletedAt,
                    s.Status,
                    completedLessons,
                    totalLessons,
                    progressPercentage,
                    s.LastActivityAt
                };
            }).ToList();

            return Ok(new
            {
                courseId = course.Id,
                courseTitle = course.Title,
                totalLessons,
                studentsCount = results.Count,
                students = results
            });
        }

        // ========================================
        // Current Instructor ID
        // ========================================

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
