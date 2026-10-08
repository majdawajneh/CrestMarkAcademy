using Application.Dto_s.CourseRequirement;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/courses/{courseId:int}/requirements")]
    [Authorize(Roles = "Admin")]
    public class AdminCourseRequirementsController : ControllerBase
    {
        private readonly
            ICourseRequirementService
            _requirementService;


        // =========================
        // Constructor
        // =========================

        public AdminCourseRequirementsController(
            ICourseRequirementService requirementService)
        {
            _requirementService = requirementService;
        }


        // =========================
        // Get All Requirements
        // By Course
        // =========================

        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<CourseRequirementDto>>>
            GetAll(int courseId)
        {
            var requirements =
                await _requirementService
                    .GetByCourseIdAsync(courseId);


            return Ok(requirements);
        }


        // =========================
        // Get Requirement By Id
        // =========================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CourseRequirementDto>>
            GetById(
                int courseId,
                int id)
        {
            var requirement =
                await _requirementService
                    .GetByIdAsync(id);


            if (requirement == null ||
                requirement.CourseId != courseId)
            {
                return NotFound(new
                {
                    Message =
                        "Course requirement was not found."
                });
            }


            return Ok(requirement);
        }


        // =========================
        // Create Requirement
        // =========================

        [HttpPost]
        public async Task<ActionResult<CourseRequirementDto>>
            Create(
                int courseId,
                CreateCourseRequirementDto dto)
        {
            var requirement =
                await _requirementService
                    .CreateAsync(
                        courseId,
                        dto
                    );


            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    courseId = courseId,
                    id = requirement.Id
                },
                requirement
            );
        }


        // =========================
        // Update Requirement
        // =========================

        [HttpPut("{id:int}")]
        public async Task<ActionResult<CourseRequirementDto>>
            Update(
                int courseId,
                int id,
                UpdateCourseRequirementDto dto)
        {
            var requirement =
                await _requirementService
                    .UpdateAsync(
                        courseId,
                        id,
                        dto
                    );


            return Ok(requirement);
        }


        // =========================
        // Delete Requirement
        // =========================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult>
            Delete(
                int courseId,
                int id)
        {
            await _requirementService
                .DeleteAsync(
                    courseId,
                    id
                );


            return NoContent();
        }
    }
}