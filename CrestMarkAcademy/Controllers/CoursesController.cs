using Application.Dto_s.Course;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/courses")]
    public class CoursesController : ControllerBase
    {
        private readonly ICourseService _courseService;


        // =========================
        // Constructor
        // =========================

        public CoursesController(
            ICourseService courseService)
        {
            _courseService = courseService;
        }


        // =========================
        // Get Published Courses
        // Public
        // =========================

        [AllowAnonymous]
        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<CourseListDto>>>
            GetAll()
        {
            var courses =
                await _courseService
                    .GetPublishedAsync();


            return Ok(courses);
        }


        // =========================
        // Get Published Course
        // By Slug
        // =========================

        [AllowAnonymous]
        [HttpGet("{slug}")]
        public async Task<ActionResult<CourseDto>>
            GetBySlug(string slug)
        {
            var course =
                await _courseService
                    .GetBySlugAsync(slug);


            if (course == null)
            {
                return NotFound(new
                {
                    Message =
                        "Course was not found."
                });
            }


            return Ok(course);
        }
    }
}