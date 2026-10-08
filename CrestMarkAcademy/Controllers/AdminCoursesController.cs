using Application.Dto_s.Course;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/admin/courses")]
    [Authorize(Roles = "Admin")]
    public class AdminCoursesController : Controller
    {
        private readonly ICourseService _courseService;


        // =========================
        // Constructor
        // =========================

        public AdminCoursesController(
            ICourseService courseService)
        {
            _courseService = courseService;
        }


        // =========================
        // Get All Courses
        // Draft + Published + Archived
        // =========================

        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<CourseListDto>>>
            GetAll()
        {
            var courses =
                await _courseService
                    .GetAllForAdminAsync();


            return Ok(courses);
        }


        // =========================
        // Get Course By Id
        // =========================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CourseDto>>
            GetById(int id)
        {
            var course =
                await _courseService
                    .GetByIdAsync(id);


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


        // =========================
        // Create Course
        // Default Status = Draft
        // =========================

        [HttpPost]
        public async Task<ActionResult<CourseDto>>
            Create(CreateCourseDto dto)
        {
            var course =
                await _courseService
                    .CreateAsync(dto);


            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id = course.Id
                },
                course
            );
        }


        // =========================
        // Update Course
        // =========================

        [HttpPut("{id:int}")]
        public async Task<ActionResult<CourseDto>>
            Update(
                int id,
                UpdateCourseDto dto)
        {
            var course =
                await _courseService
                    .UpdateAsync(
                        id,
                        dto
                    );


            return Ok(course);
        }


        // =========================
        // Publish Course
        // Draft -> Published
        // =========================

        [HttpPatch("{id:int}/publish")]
        public async Task<ActionResult<CourseDto>>
            Publish(int id)
        {
            var course =
                await _courseService
                    .PublishAsync(id);


            return Ok(course);
        }


        // =========================
        // Unpublish Course
        // Published -> Draft
        // =========================

        [HttpPatch("{id:int}/unpublish")]
        public async Task<ActionResult<CourseDto>>
            Unpublish(int id)
        {
            var course =
                await _courseService
                    .UnpublishAsync(id);


            return Ok(course);
        }


        // =========================
        // Archive Course
        // =========================

        [HttpPatch("{id:int}/archive")]
        public async Task<ActionResult<CourseDto>>
            Archive(int id)
        {
            var course =
                await _courseService
                    .ArchiveAsync(id);


            return Ok(course);
        }


        // =========================
        // Restore Archived Course
        // Archived -> Draft
        // =========================

        [HttpPatch("{id:int}/restore")]
        public async Task<ActionResult<CourseDto>>
            Restore(int id)
        {
            var course =
                await _courseService
                    .RestoreToDraftAsync(id);


            return Ok(course);
        }
    }
}
