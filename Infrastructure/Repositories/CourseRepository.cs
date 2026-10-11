
using Application.Repositories.Interfaces;
using Domain.Entities.Catalog;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class CourseRepository : ICourseRepository
    {
        private readonly CrestMark_DbContext _context;

        public CourseRepository(CrestMark_DbContext context)
        {
            _context = context;
        }

        // =========================
        // Get All Courses - Admin
        // =========================

        public async Task<IEnumerable<Course>> GetAllWithDetailsAsync()
        {
            return await _context
                .Set<Course>()
                .AsNoTracking()
                .Include(c => c.Category)
                .Include(c => c.Instructor)
                .Include(c => c.Reviews)
                .Include(c => c.Enrollments)
                .AsSplitQuery()
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        // =========================
        // Get Published Courses - Public
        // =========================

        public async Task<IEnumerable<Course>> GetPublishedWithDetailsAsync()
        {
            return await _context
                .Set<Course>()
                .AsNoTracking()
                .Where(c => c.Status == "Published")
                .Include(c => c.Category)
                .Include(c => c.Instructor)
                .Include(c => c.Reviews)
                .Include(c => c.Enrollments)
                .AsSplitQuery()
                .OrderByDescending(c => c.PublishedAt)
                .ToListAsync();
        }

        // =========================
        // Get Course By Id - Admin
        // =========================

        public async Task<Course?> GetByIdWithDetailsAsync(int id)
        {
            return await _context
                .Set<Course>()
                .AsNoTracking()
                .Include(c => c.Category)
                .Include(c => c.Instructor)
                .Include(c => c.Reviews)
                .Include(c => c.Enrollments)
                .Include(c => c.Requirements)
                .Include(c => c.LearningOutcomes)
                .AsSplitQuery()
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        // =========================
        // Get Course By Slug - Public
        // =========================

        public async Task<Course?> GetBySlugWithDetailsAsync(
            string slug,
            bool publishedOnly = true)
        {
            var query = _context
                .Set<Course>()
                .AsNoTracking()
                .Include(c => c.Category)
                .Include(c => c.Instructor)
                .Include(c => c.Reviews)
                .Include(c => c.Enrollments)
                .Include(c => c.Requirements)
                .Include(c => c.LearningOutcomes)
                .AsSplitQuery()
                .AsQueryable();

            if (publishedOnly)
            {
                query = query.Where(c => c.Status == "Published");
            }

            return await query.FirstOrDefaultAsync(
                c => c.Slug == slug
            );
        }

        // =========================
        // Check Course Title
        // =========================

        public async Task<bool> TitleExistsAsync(
            string title,
            int? excludeCourseId = null)
        {
            var query = _context
                .Set<Course>()
                .AsNoTracking()
                .Where(c => c.Title.ToLower() == title.ToLower());

            if (excludeCourseId.HasValue)
            {
                query = query.Where(
                    c => c.Id != excludeCourseId.Value
                );
            }

            return await query.AnyAsync();
        }

        // =========================
        // Check Course Slug
        // =========================

        public async Task<bool> SlugExistsAsync(
            string slug,
            int? excludeCourseId = null)
        {
            var query = _context
                .Set<Course>()
                .AsNoTracking()
                .Where(c => c.Slug == slug);

            if (excludeCourseId.HasValue)
            {
                query = query.Where(
                    c => c.Id != excludeCourseId.Value
                );
            }

            return await query.AnyAsync();
        }

        // =========================
        // Get Published Course Content
        // =========================

        public async Task<Course?> GetPublishedContentBySlugAsync(
            string slug)
        {
            return await _context
                .Set<Course>()
                .AsNoTracking()
                .Where(c =>
                    c.Slug == slug &&
                    c.Status == "Published"
                )
                .Include(c => c.CourseSections)
                    .ThenInclude(s => s.Lessons)
                .AsSplitQuery()
                .FirstOrDefaultAsync();
        }
    }
}
