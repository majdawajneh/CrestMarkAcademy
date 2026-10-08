using Application.Dto_s.Category;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryDto>> GetAllAsync(bool includeInactive = false);

        Task<CategoryDto?> GetByIdAsync(int id);

        Task<CategoryDto?> GetBySlugAsync(string slug);

        Task<CategoryDto> CreateAsync(CreateCategoryDto dto);

        Task<CategoryDto> UpdateAsync(int id,UpdateCategoryDto dto);

        Task DeactivateAsync(int id);

        Task ActivateAsync(int id);
    }
}
