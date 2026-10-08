using Application.Dto_s.Category;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/categories")]
    [Authorize(Roles = "Admin")]
    public class AdminCategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public AdminCategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        // =========================
        // Get All Categories
        // Active + Inactive
        // =========================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>>GetAll()
        {
            var categories = await _categoryService.GetAllAsync(includeInactive: true);
            return Ok(categories);
        }

        // =========================
        // Get Category By Id
        // =========================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CategoryDto>>GetById(int id)
        {
            var category = await _categoryService.GetByIdAsync(id);

            if (category == null)
            {
                return NotFound(new
                {
                    Message ="Category was not found."
                });
            }

            return Ok(category);
        }

        // =========================
        // Create Category
        // =========================

        [HttpPost]
        public async Task<ActionResult<CategoryDto>>Create(CreateCategoryDto dto)
        {
            var category = await _categoryService.CreateAsync(dto);

            return CreatedAtAction(nameof(GetById),new
                {
                    id = category.Id
                },category
            );
        }

        // =========================
        // Update Category
        // =========================

        [HttpPut("{id:int}")]
        public async Task<ActionResult<CategoryDto>>Update(int id,UpdateCategoryDto dto)
        {
            var category = await _categoryService.UpdateAsync(id,dto);
            return Ok(category);
        }

        // =========================
        // Deactivate Category
        // =========================

        [HttpPatch("{id:int}/deactivate")]
        public async Task<IActionResult>Deactivate(int id)
        {
            await _categoryService.DeactivateAsync(id);

            return Ok(new
            {
                Message ="Category deactivated successfully."
            });
        }

        // =========================
        // Activate Category
        // =========================

        [HttpPatch("{id:int}/activate")]
        public async Task<IActionResult>Activate(int id)
        {
            await _categoryService.ActivateAsync(id);
            return Ok(new
            {
                Message ="Category activated successfully."
            });
        }
    }
}