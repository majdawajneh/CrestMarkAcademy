using Application.Dto_s.CourseContent;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/courses/{slug}/content")]
    public class CourseContentController : ControllerBase
    {
        private readonly
            ICourseContentService
            _courseContentService;


        // =========================
        // Constructor
        // =========================

        public CourseContentController(
            ICourseContentService courseContentService)
        {
            _courseContentService = courseContentService;
        }


        // =========================
        // Get Course Content
        // Visitor + Enrolled Student
        // =========================

        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<CourseContentDto>>
            GetCourseContent(string slug)
        {
            int? userId = null;


            // If the request contains
            // a valid JWT token,
            // get the User Id.

            var userIdClaim =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );


            if (int.TryParse(
                userIdClaim,
                out var parsedUserId))
            {
                userId =
                    parsedUserId;
            }


            var courseContent =
                await _courseContentService
                    .GetCourseContentAsync(
                        slug,
                        userId
                    );


            if (courseContent == null)
            {
                return NotFound(new
                {
                    Message =
                        "Course was not found."
                });
            }


            return Ok(courseContent);
        }
    }
}