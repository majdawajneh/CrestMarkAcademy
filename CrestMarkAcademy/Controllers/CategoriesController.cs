using Application.Dto_s.Category;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/categories")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;


        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        // =========================
        // Get Active Categories
        // =========================

        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>>GetAll()
        {
            var categories = await _categoryService.GetAllAsync(includeInactive: false);
            return Ok(categories);
        }

        // =========================
        // Get Category By Slug
        // =========================

        [AllowAnonymous]
        [HttpGet("{slug}")]
        public async Task<ActionResult<CategoryDto>>GetBySlug(string slug)
        {
            var category = await _categoryService.GetBySlugAsync(slug);

            if (category == null)
            {
                return NotFound(new
                {
                    Message ="Category was not found."
                });
            }
            return Ok(category);
        }
    }
}