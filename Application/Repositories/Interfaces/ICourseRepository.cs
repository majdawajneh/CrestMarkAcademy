using Domain.Entities.Catalog;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Repositories.Interfaces
{
    public interface ICourseRepository
    {
        Task<IEnumerable<Course>> GetAllWithDetailsAsync();

        Task<IEnumerable<Course>> GetPublishedWithDetailsAsync();

        Task<Course?> GetByIdWithDetailsAsync(int id);

        Task<Course?> GetBySlugWithDetailsAsync(string slug,bool publishedOnly = true);

        Task<bool> TitleExistsAsync(string title,int? excludeCourseId = null);

        Task<bool> SlugExistsAsync(string slug,int? excludeCourseId = null);
        Task<Course?> GetPublishedContentBySlugAsync(string slug);
    }
}
