using Application.Dto_s.CourseLearningOutcome;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/courses/{courseId:int}/learning-outcomes")]
    [Authorize(Roles = "Admin")]
    public class AdminCourseLearningOutcomesController : ControllerBase
    {
        private readonly
            ICourseLearningOutcomeService
            _outcomeService;


        // =========================
        // Constructor
        // =========================

        public AdminCourseLearningOutcomesController(
            ICourseLearningOutcomeService outcomeService)
        {
            _outcomeService = outcomeService;
        }


        // =========================
        // Get All Learning Outcomes
        // By Course
        // =========================

        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<CourseLearningOutcomeDto>>>
            GetAll(int courseId)
        {
            var outcomes =
                await _outcomeService
                    .GetByCourseIdAsync(courseId);


            return Ok(outcomes);
        }


        // =========================
        // Get Learning Outcome By Id
        // =========================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CourseLearningOutcomeDto>>
            GetById(
                int courseId,
                int id)
        {
            var outcome =
                await _outcomeService
                    .GetByIdAsync(id);


            if (outcome == null ||
                outcome.CourseId != courseId)
            {
                return NotFound(new
                {
                    Message =
                        "Course learning outcome was not found."
                });
            }


            return Ok(outcome);
        }


        // =========================
        // Create Learning Outcome
        // =========================

        [HttpPost]
        public async Task<ActionResult<CourseLearningOutcomeDto>>
            Create(
                int courseId,
                CreateCourseLearningOutcomeDto dto)
        {
            var outcome =
                await _outcomeService
                    .CreateAsync(
                        courseId,
                        dto
                    );


            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    courseId = courseId,
                    id = outcome.Id
                },
                outcome
            );
        }


        // =========================
        // Update Learning Outcome
        // =========================

        [HttpPut("{id:int}")]
        public async Task<ActionResult<CourseLearningOutcomeDto>>
            Update(
                int courseId,
                int id,
                UpdateCourseLearningOutcomeDto dto)
        {
            var outcome =
                await _outcomeService
                    .UpdateAsync(
                        courseId,
                        id,
                        dto
                    );


            return Ok(outcome);
        }


        // =========================
        // Delete Learning Outcome
        // =========================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult>
            Delete(
                int courseId,
                int id)
        {
            await _outcomeService
                .DeleteAsync(
                    courseId,
                    id
                );


            return NoContent();
        }
    }
}