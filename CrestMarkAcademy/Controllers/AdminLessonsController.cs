using Application.Dto_s.Lesson;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/sections/{sectionId:int}/lessons")]
    [Authorize(Roles = "Admin")]
    public class AdminLessonsController : ControllerBase
    {
        private readonly ILessonService _lessonService;


        // =========================
        // Constructor
        // =========================

        public AdminLessonsController(
            ILessonService lessonService)
        {
            _lessonService = lessonService;
        }


        // =========================
        // Get All Lessons
        // By Section
        // =========================

        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<LessonDto>>>
            GetAll(int sectionId)
        {
            var lessons =
                await _lessonService
                    .GetBySectionIdAsync(sectionId);


            return Ok(lessons);
        }


        // =========================
        // Get Lesson By Id
        // =========================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<LessonDto>>
            GetById(
                int sectionId,
                int id)
        {
            var lesson =
                await _lessonService
                    .GetByIdAsync(id);


            if (lesson == null ||
                lesson.CourseSectionId != sectionId)
            {
                return NotFound(new
                {
                    Message =
                        "Lesson was not found."
                });
            }


            return Ok(lesson);
        }


        // =========================
        // Create Lesson
        // =========================

        [HttpPost]
        public async Task<ActionResult<LessonDto>>
            Create(
                int sectionId,
                CreateLessonDto dto)
        {
            var lesson =
                await _lessonService
                    .CreateAsync(
                        sectionId,
                        dto
                    );


            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    sectionId = sectionId,
                    id = lesson.Id
                },
                lesson
            );
        }


        // =========================
        // Update Lesson
        // =========================

        [HttpPut("{id:int}")]
        public async Task<ActionResult<LessonDto>>
            Update(
                int sectionId,
                int id,
                UpdateLessonDto dto)
        {
            var lesson =
                await _lessonService
                    .UpdateAsync(
                        sectionId,
                        id,
                        dto
                    );


            return Ok(lesson);
        }


        // =========================
        // Delete Lesson
        // =========================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult>
            Delete(
                int sectionId,
                int id)
        {
            await _lessonService
                .DeleteAsync(
                    sectionId,
                    id
                );


            return NoContent();
        }
    }
}