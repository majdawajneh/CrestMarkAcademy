using Application.Dto_s.LessonProgress;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize]
    public class LessonProgressController : ControllerBase
    {
        private readonly
            ILessonProgressService
            _lessonProgressService;


        // =========================
        // Constructor
        // =========================

        public LessonProgressController(
            ILessonProgressService lessonProgressService)
        {
            _lessonProgressService =
                lessonProgressService;
        }


        // =========================
        // Get Lesson Progress
        // =========================

        [HttpGet("lessons/{lessonId:int}/progress")]
        public async Task<ActionResult<LessonProgressDto>>
            GetLessonProgress(int lessonId)
        {
            var userId =
                GetCurrentUserId();


            var progress =
                await _lessonProgressService
                    .GetLessonProgressAsync(
                        userId,
                        lessonId
                    );


            if (progress == null)
            {
                return Ok(new
                {
                    LessonId =
                        lessonId,

                    IsCompleted =
                        false,

                    CompletedAt =
                        (DateTime?)null,

                    LastPositionSeconds =
                        0
                });
            }


            return Ok(progress);
        }


        // =========================
        // Update Lesson Progress
        // =========================

        [HttpPut("lessons/{lessonId:int}/progress")]
        public async Task<ActionResult<LessonProgressDto>>
            UpdateLessonProgress(
                int lessonId,
                UpdateLessonProgressDto dto)
        {
            var userId =
                GetCurrentUserId();


            var progress =
                await _lessonProgressService
                    .UpdateProgressAsync(
                        userId,
                        lessonId,
                        dto
                    );


            return Ok(progress);
        }


        // =========================
        // Get Course Progress
        // =========================

        [HttpGet("courses/{courseId:int}/progress")]
        public async Task<ActionResult<CourseProgressDto>>
            GetCourseProgress(
                int courseId)
        {
            var userId =
                GetCurrentUserId();


            var progress =
                await _lessonProgressService
                    .GetCourseProgressAsync(
                        userId,
                        courseId
                    );


            return Ok(progress);
        }


        // =========================
        // Get Current User Id
        // From JWT
        // =========================

        private int GetCurrentUserId()
        {
            var userIdClaim =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );


            if (!int.TryParse(
                userIdClaim,
                out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Invalid user token."
                );
            }


            return userId;
        }
    }
}