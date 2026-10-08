using Application.Repositories.Interfaces;
using Domain.Entities.Catalog;
using Domain.Entities.Learning;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;


namespace Infrastructure.Repositories
{
    public class LessonProgressRepository
        : ILessonProgressRepository
    {
        private readonly
            CrestMark_DbContext
            _context;


        // =========================
        // Constructor
        // =========================

        public LessonProgressRepository(
            CrestMark_DbContext context)
        {
            _context = context;
        }


        // =========================
        // Get Lesson
        // With Section + Course
        // =========================

        public async Task<Lesson?>
            GetLessonWithCourseAsync(
                int lessonId)
        {
            return await _context
                .Set<Lesson>()
                .AsNoTracking()
                .Include(l => l.CourseSection)
                    .ThenInclude(s => s.Course)
                .FirstOrDefaultAsync(
                    l => l.Id == lessonId
                );
        }


        // =========================
        // Count Published Lessons
        // In Course
        // =========================

        public async Task<int>
            GetPublishedLessonsCountAsync(
                int courseId)
        {
            return await _context
                .Set<Lesson>()
                .AsNoTracking()
                .CountAsync(
                    l =>
                        l.CourseSection.CourseId
                            == courseId
                        &&
                        l.IsPublished
                );
        }


        // =========================
        // Count Completed Lessons
        // For Enrollment
        // =========================

        public async Task<int>
            GetCompletedLessonsCountAsync(
                int enrollmentId,
                int courseId)
        {
            return await _context
                .Set<LessonProgress>()
                .AsNoTracking()
                .CountAsync(
                    p =>
                        p.EnrollmentId
                            == enrollmentId
                        &&
                        p.IsCompleted
                        &&
                        p.Lesson.CourseSection.CourseId
                            == courseId
                        &&
                        p.Lesson.IsPublished
                );
        }
    }
}