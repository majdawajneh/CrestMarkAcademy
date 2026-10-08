using Application.Dto_s.CourseSection;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/courses/{courseId:int}/sections")]
    [Authorize(Roles = "Admin")]
    public class AdminCourseSectionsController : ControllerBase
    {
        private readonly
            ICourseSectionService
            _sectionService;


        // =========================
        // Constructor
        // =========================

        public AdminCourseSectionsController(
            ICourseSectionService sectionService)
        {
            _sectionService = sectionService;
        }


        // =========================
        // Get All Sections
        // By Course
        // =========================

        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<CourseSectionDto>>>
            GetAll(int courseId)
        {
            var sections =
                await _sectionService
                    .GetByCourseIdAsync(courseId);


            return Ok(sections);
        }


        // =========================
        // Get Section By Id
        // =========================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CourseSectionDto>>
            GetById(
                int courseId,
                int id)
        {
            var section =
                await _sectionService
                    .GetByIdAsync(id);


            if (section == null ||
                section.CourseId != courseId)
            {
                return NotFound(new
                {
                    Message =
                        "Course section was not found."
                });
            }


            return Ok(section);
        }


        // =========================
        // Create Section
        // =========================

        [HttpPost]
        public async Task<ActionResult<CourseSectionDto>>
            Create(
                int courseId,
                CreateCourseSectionDto dto)
        {
            var section =
                await _sectionService
                    .CreateAsync(
                        courseId,
                        dto
                    );


            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    courseId = courseId,
                    id = section.Id
                },
                section
            );
        }


        // =========================
        // Update Section
        // =========================

        [HttpPut("{id:int}")]
        public async Task<ActionResult<CourseSectionDto>>
            Update(
                int courseId,
                int id,
                UpdateCourseSectionDto dto)
        {
            var section =
                await _sectionService
                    .UpdateAsync(
                        courseId,
                        id,
                        dto
                    );


            return Ok(section);
        }


        // =========================
        // Delete Section
        // =========================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult>
            Delete(
                int courseId,
                int id)
        {
            await _sectionService
                .DeleteAsync(
                    courseId,
                    id
                );


            return NoContent();
        }
    }
}