using Application.Dto_s.Category;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using System.Text.RegularExpressions;

namespace Application.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly IGenericRepository<Category> _categoryRepo;


        public CategoryService(
            IGenericRepository<Category> categoryRepo)
        {
            _categoryRepo = categoryRepo;
        }


        // =========================
        // Get All
        // =========================

        public async Task<IEnumerable<CategoryDto>> GetAllAsync(
            bool includeInactive = false)
        {
            var categories = (await _categoryRepo.GetAllAsync()).ToList();

            if (!includeInactive)
            {
                categories = categories.Where(c => c.IsActive).ToList();
            }

            var categoryDictionary = categories.ToDictionary(c => c.Id);

            var result = categories.Select(category => {
                    string? parentName = null;

                    if (category.ParentCategoryId.HasValue)
                    {
                        categoryDictionary.TryGetValue(
                            category.ParentCategoryId.Value,
                            out var parent
                        );

                        parentName = parent?.Name;
                    }


                    return MapToDto(
                        category,
                        parentName
                    );
                })
                .ToList();


            return result;
        }


        // =========================
        // Get By Id
        // =========================

        public async Task<CategoryDto?> GetByIdAsync(int id)
        {
            var category = await _categoryRepo.GetByIdAsync(id);

            if (category == null)
            {
                return null;
            }
            string? parentName = null;

            if (category.ParentCategoryId.HasValue)
            {
                var parent = await _categoryRepo.GetByIdAsync(category.ParentCategoryId.Value);
                parentName = parent?.Name;
            }

            return MapToDto(category,parentName);
        }


        // =========================
        // Get By Slug
        // =========================

        public async Task<CategoryDto?> GetBySlugAsync(string slug)
        {
            slug = slug.Trim().ToLowerInvariant();

            var category = await _categoryRepo.FirstOrDefaultAsync(c => c.Slug == slug && c.IsActive);

            if (category == null)
            {
                return null;
            }

            string? parentName = null;

            if (category.ParentCategoryId.HasValue)
            {
                var parent = await _categoryRepo.GetByIdAsync(category.ParentCategoryId.Value);

                parentName = parent?.Name;
            }

            return MapToDto(category,parentName);
        }


        // =========================
        // Create
        // =========================

        public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
        {
            string name = dto.Name.Trim();


            // =========================
            // 1. Check duplicate name
            // =========================

            bool nameExists = await _categoryRepo.ExistsAsync(c => c.Name.ToLower() == name.ToLower());

            if (nameExists)
            {
                throw new InvalidOperationException("Category name already exists.");
            }

            // =========================
            // 2. Generate Slug
            // =========================

            string slug = GenerateSlug(name);

            bool slugExists = await _categoryRepo.ExistsAsync(c => c.Slug == slug);

            if (slugExists)
            {
                throw new InvalidOperationException("Category slug already exists.");
            }

            // =========================
            // 3. Validate Parent
            // =========================

            string? parentName = null;

            if (dto.ParentCategoryId.HasValue)
            {
                var parent = await _categoryRepo.GetByIdAsync(dto.ParentCategoryId.Value);

                if (parent == null)
                {
                    throw new KeyNotFoundException("Parent category was not found.");
                }

                parentName = parent.Name;
            }

            // =========================
            // 4. Create Category
            // =========================

            var category = new Category
            {
                Name = name,
                Slug = slug,
                Description = dto.Description?.Trim(),
                ImageUrl = dto.ImageUrl?.Trim(),
                ParentCategoryId = dto.ParentCategoryId,
                IsActive = dto.IsActive
            };


            await _categoryRepo.AddAsync(category);

            await _categoryRepo.SaveChangesAsync();

            // =========================
            // 5. Return DTO
            // =========================

            return MapToDto(category,parentName);
        }


        // =========================
        // Update
        // =========================

        public async Task<CategoryDto> UpdateAsync(int id,UpdateCategoryDto dto)
        {
            // =========================
            // 1. Get Category
            // =========================

            var category = await _categoryRepo.GetByIdAsync(id);


            if (category == null)
            {
                throw new KeyNotFoundException("Category was not found.");
            }


            string name = dto.Name.Trim();

            // =========================
            // 2. Check Duplicate Name
            // =========================

            bool nameExists = await _categoryRepo.ExistsAsync(c => c.Id != id && c.Name.ToLower() == name.ToLower());

            if (nameExists)
            {
                throw new InvalidOperationException("Category name already exists.");
            }

            // =========================
            // 3. Generate New Slug
            // =========================

            string slug = GenerateSlug(name);

            bool slugExists =await _categoryRepo.ExistsAsync(c => c.Id != id && c.Slug == slug);

            if (slugExists)
            {
                throw new InvalidOperationException("Category slug already exists.");
            }

            // =========================
            // 4. Validate Parent
            // =========================

            await ValidateParentAsync(id,dto.ParentCategoryId);

            string? parentName = null;

            if (dto.ParentCategoryId.HasValue)
            {
                var parent = await _categoryRepo.GetByIdAsync(dto.ParentCategoryId.Value);
                parentName = parent?.Name;
            }


            // =========================
            // 5. Update Category
            // =========================

            category.Name =name;

            category.Slug =slug;

            category.Description =dto.Description?.Trim();

            category.ImageUrl =dto.ImageUrl?.Trim();

            category.ParentCategoryId =dto.ParentCategoryId;

            category.IsActive =dto.IsActive;

            _categoryRepo.Update(category);

            await _categoryRepo.SaveChangesAsync();

            // =========================
            // 6. Return DTO
            // =========================

            return MapToDto(category,parentName);
        }

        // =========================
        // Deactivate
        // =========================

        public async Task DeactivateAsync(int id)
        {
            var category = await _categoryRepo.GetByIdAsync(id);

            if (category == null)
            {
                throw new KeyNotFoundException("Category was not found.");
            }

            if (!category.IsActive)
            {
                return;
            }

            category.IsActive =false;

            _categoryRepo.Update(category);

            await _categoryRepo.SaveChangesAsync();
        }

        // =========================
        // Activate
        // =========================

        public async Task ActivateAsync(int id)
        {
            var category = await _categoryRepo.GetByIdAsync(id);

            if (category == null)
            {
                throw new KeyNotFoundException("Category was not found.");
            }

            if (category.IsActive)
            {
                return;
            }

            category.IsActive = true;

            _categoryRepo.Update(category);

            await _categoryRepo.SaveChangesAsync();
        }

        // =========================
        // Validate Parent Category
        // =========================

        private async Task ValidateParentAsync(int categoryId,int? parentCategoryId)
        {
            if (!parentCategoryId.HasValue)
            {
                return;
            }

            // Category cannot be
            // its own parent
            if (categoryId == parentCategoryId.Value)
            {
                throw new InvalidOperationException("A category cannot be its own parent.");
            }

            var parent =await _categoryRepo.GetByIdAsync(parentCategoryId.Value);

            if (parent == null)
            {
                throw new KeyNotFoundException("Parent category was not found.");
            }

            // =========================
            // Prevent Circular Relation
            // =========================

            var currentParent =parent;

            while (currentParent.ParentCategoryId.HasValue)
            {
                if (currentParent.ParentCategoryId.Value == categoryId)
                {
                    throw new InvalidOperationException("Circular category relationships are not allowed.");
                }

                var nextParent = await _categoryRepo.GetByIdAsync(currentParent.ParentCategoryId.Value);

                if (nextParent == null)
                {
                    break;
                }

                currentParent = nextParent;
            }
        }

        // =========================
        // Generate Slug
        // =========================

        private static string GenerateSlug(string value)
        {
            string slug = value.Trim().ToLowerInvariant();

            // Supports Arabic,
            // English and numbers
            slug = Regex.Replace(slug,@"[^\p{L}\p{N}]+","-");

            slug = slug.Trim('-');

            if (string.IsNullOrWhiteSpace(slug))
            {
                throw new InvalidOperationException("Unable to generate category slug.");
            }

            return slug;
        }

        // =========================
        // Map Entity To DTO
        // =========================

        private static CategoryDto MapToDto(Category category,string? parentCategoryName)
        {
            return new CategoryDto
            {
                Id =category.Id,

                Name =category.Name,

                Slug =category.Slug,

                Description =category.Description,

                ImageUrl =category.ImageUrl,

                ParentCategoryId =category.ParentCategoryId,

                ParentCategoryName =parentCategoryName,

                IsActive =category.IsActive
            };
        }
    }
}