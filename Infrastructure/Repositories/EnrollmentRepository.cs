using Application.Repositories.Interfaces;
using Domain.Entities.Learning;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;


namespace Infrastructure.Repositories
{
    public class EnrollmentRepository
        : IEnrollmentRepository
    {
        private readonly
            CrestMark_DbContext
            _context;


        // =========================
        // Constructor
        // =========================

        public EnrollmentRepository(
            CrestMark_DbContext context)
        {
            _context = context;
        }


        // =========================
        // Get Enrollment By Id
        // With Course
        // =========================

        public async Task<Enrollment?>
            GetByIdWithCourseAsync(int id)
        {
            return await _context
                .Set<Enrollment>()
                .AsNoTracking()
                .Include(e => e.Course)
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id);
        }


        // =========================
        // Get Enrollment
        // By User + Course
        // =========================

        public async Task<Enrollment?>
            GetByUserAndCourseAsync(
                int userId,
                int courseId)
        {
            return await _context
                .Set<Enrollment>()
                .AsNoTracking()
                .Include(e => e.Course)
                .FirstOrDefaultAsync(
                    e =>
                        e.UserId == userId &&
                        e.CourseId == courseId
                );
        }


        // =========================
        // Get User Courses
        // My Learning
        // =========================

        public async Task<IEnumerable<Enrollment>>
            GetByUserIdWithCoursesAsync(
                int userId)
        {
            return await _context
                .Set<Enrollment>()
                .AsNoTracking()
                .Include(e => e.Course)
                .Where(
                    e => e.UserId == userId
                )
                .OrderByDescending(
                    e => e.EnrolledAt
                )
                .ToListAsync();
        }
    }
}