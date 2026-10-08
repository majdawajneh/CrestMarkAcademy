using Application.Dto_s.LessonResource;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/lessons/{lessonId:int}/resources")]
    [Authorize(Roles = "Admin")]
    public class AdminLessonResourcesController : ControllerBase
    {
        private readonly
            ILessonResourceService
            _resourceService;


        // =========================
        // Constructor
        // =========================

        public AdminLessonResourcesController(
            ILessonResourceService resourceService)
        {
            _resourceService = resourceService;
        }


        // =========================
        // Get All Resources
        // By Lesson
        // =========================

        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<LessonResourceDto>>>
            GetAll(int lessonId)
        {
            var resources =
                await _resourceService
                    .GetByLessonIdAsync(lessonId);


            return Ok(resources);
        }


        // =========================
        // Get Resource By Id
        // =========================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<LessonResourceDto>>
            GetById(
                int lessonId,
                int id)
        {
            var resource =
                await _resourceService
                    .GetByIdAsync(id);


            if (resource == null ||
                resource.LessonId != lessonId)
            {
                return NotFound(new
                {
                    Message =
                        "Lesson resource was not found."
                });
            }


            return Ok(resource);
        }


        // =========================
        // Create Resource
        // =========================

        [HttpPost]
        public async Task<ActionResult<LessonResourceDto>>
            Create(
                int lessonId,
                CreateLessonResourceDto dto)
        {
            var resource =
                await _resourceService
                    .CreateAsync(
                        lessonId,
                        dto
                    );


            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    lessonId = lessonId,
                    id = resource.Id
                },
                resource
            );
        }


        // =========================
        // Update Resource
        // =========================

        [HttpPut("{id:int}")]
        public async Task<ActionResult<LessonResourceDto>>
            Update(
                int lessonId,
                int id,
                UpdateLessonResourceDto dto)
        {
            var resource =
                await _resourceService
                    .UpdateAsync(
                        lessonId,
                        id,
                        dto
                    );


            return Ok(resource);
        }


        // =========================
        // Delete Resource
        // =========================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult>
            Delete(
                int lessonId,
                int id)
        {
            await _resourceService
                .DeleteAsync(
                    lessonId,
                    id
                );


            return NoContent();
        }
    }
}