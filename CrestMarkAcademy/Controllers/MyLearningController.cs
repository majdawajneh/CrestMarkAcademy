
using Application.Dto_s.Enrollment;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/my-learning")]
    [Authorize]
    public class MyLearningController : ControllerBase
    {
        private readonly IEnrollmentService _enrollmentService;

        public MyLearningController(
            IEnrollmentService enrollmentService)
        {
            _enrollmentService = enrollmentService;
        }

        // =====================================
        // Get Current User ID
        // =====================================

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            return int.TryParse(userIdClaim, out var userId)
                && userId > 0
                    ? userId
                    : null;
        }

        // =====================================
        // Get My Courses
        // GET /api/my-learning
        // =====================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MyCourseDto>>>
            GetMyCourses()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    Message = "Invalid user token."
                });
            }

            var courses = await _enrollmentService
                .GetMyCoursesAsync(userId.Value);

            return Ok(courses);
        }

        // =====================================
        // Get Last Accessed Lesson
        // GET /api/my-learning/{courseId}/last-lesson
        // =====================================

        [HttpGet("{courseId:int}/last-lesson")]
        public async Task<IActionResult> GetLastLesson(
            int courseId)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    Message = "Invalid user token."
                });
            }

            if (courseId <= 0)
            {
                return BadRequest(new
                {
                    Message = "Invalid course ID."
                });
            }

            try
            {
                var lessonId = await _enrollmentService
                    .GetLastAccessedLessonAsync(
                        userId.Value,
                        courseId
                    );

                return Ok(new
                {
                    CourseId = courseId,
                    LastAccessedLessonId = lessonId
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // =====================================
        // Save Last Accessed Lesson
        // PUT /api/my-learning/{courseId}/last-lesson
        // =====================================

        [HttpPut("{courseId:int}/last-lesson")]
        public async Task<IActionResult> SetLastLesson(
            int courseId,
            [FromBody] SetLastLessonRequest request)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    Message = "Invalid user token."
                });
            }

            if (courseId <= 0 || request.LessonId <= 0)
            {
                return BadRequest(new
                {
                    Message = "Invalid course or lesson ID."
                });
            }

            try
            {
                await _enrollmentService
                    .SetLastAccessedLessonAsync(
                        userId.Value,
                        courseId,
                        request.LessonId
                    );

                return Ok(new
                {
                    CourseId = courseId,
                    LastAccessedLessonId = request.LessonId
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new
                {
                    Message =
                        "The lesson was not found in this course."
                });
            }
        }

        // =====================================
        // Request Model
        // =====================================

        public sealed class SetLastLessonRequest
        {
            public int LessonId { get; set; }
        }
    }
}
