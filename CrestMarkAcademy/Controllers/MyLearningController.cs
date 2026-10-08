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
        private readonly
            IEnrollmentService
            _enrollmentService;


        // =========================
        // Constructor
        // =========================

        public MyLearningController(
            IEnrollmentService enrollmentService)
        {
            _enrollmentService = enrollmentService;
        }


        // =========================
        // Get My Courses
        // =========================

        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<MyCourseDto>>>
            GetMyCourses()
        {
            var userIdClaim =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );


            if (!int.TryParse(
                userIdClaim,
                out var userId))
            {
                return Unauthorized(new
                {
                    Message =
                        "Invalid user token."
                });
            }


            var courses =
                await _enrollmentService
                    .GetMyCoursesAsync(userId);


            return Ok(courses);
        }
    }
}