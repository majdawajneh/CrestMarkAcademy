using Application.Dto_s.CourseLearningOutcome;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services
{
    public class CourseLearningOutcomeService : ICourseLearningOutcomeService
    {
        private readonly
           IGenericRepository<CourseLearningOutcome>
           _outcomeRepo;

        private readonly
            IGenericRepository<Course>
            _courseRepo;


        // =========================
        // Constructor
        // =========================

        public CourseLearningOutcomeService(
            IGenericRepository<CourseLearningOutcome> outcomeRepo,
            IGenericRepository<Course> courseRepo)
        {
            _outcomeRepo = outcomeRepo;
            _courseRepo = courseRepo;
        }


        // =========================
        // Get Outcomes By Course
        // =========================

        public async Task<
            IEnumerable<CourseLearningOutcomeDto>>
            GetByCourseIdAsync(int courseId)
        {
            await ValidateCourseAsync(courseId);


            var outcomes =
                await _outcomeRepo.FindAsync(
                    o => o.CourseId == courseId
                );


            return outcomes
                .OrderBy(o => o.OrderIndex)
                .Select(MapToDto)
                .ToList();
        }


        // =========================
        // Get Outcome By Id
        // =========================

        public async Task<CourseLearningOutcomeDto?>
            GetByIdAsync(int id)
        {
            var outcome =
                await _outcomeRepo
                    .GetByIdAsync(id);


            if (outcome == null)
            {
                return null;
            }


            return MapToDto(outcome);
        }


        // =========================
        // Create Outcome
        // =========================

        public async Task<CourseLearningOutcomeDto>
            CreateAsync(
                int courseId,
                CreateCourseLearningOutcomeDto dto)
        {
            await ValidateCourseAsync(courseId);


            var outcome =
                new CourseLearningOutcome
                {
                    CourseId =
                        courseId,

                    Outcome =
                        dto.Outcome.Trim(),

                    OrderIndex =
                        dto.OrderIndex
                };


            await _outcomeRepo
                .AddAsync(outcome);


            await _outcomeRepo
                .SaveChangesAsync();


            return MapToDto(outcome);
        }


        // =========================
        // Update Outcome
        // =========================

        public async Task<CourseLearningOutcomeDto>
            UpdateAsync(
                int courseId,
                int id,
                UpdateCourseLearningOutcomeDto dto)
        {
            await ValidateCourseAsync(courseId);


            var outcome =
                await _outcomeRepo
                    .GetByIdAsync(id);


            if (outcome == null ||
                outcome.CourseId != courseId)
            {
                throw new KeyNotFoundException(
                    "Course learning outcome was not found."
                );
            }


            outcome.Outcome =
                dto.Outcome.Trim();

            outcome.OrderIndex =
                dto.OrderIndex;


            _outcomeRepo.Update(
                outcome
            );


            await _outcomeRepo
                .SaveChangesAsync();


            return MapToDto(outcome);
        }


        // =========================
        // Delete Outcome
        // =========================

        public async Task DeleteAsync(
            int courseId,
            int id)
        {
            var outcome =
                await _outcomeRepo
                    .GetByIdAsync(id);


            if (outcome == null ||
                outcome.CourseId != courseId)
            {
                throw new KeyNotFoundException(
                    "Course learning outcome was not found."
                );
            }


            _outcomeRepo.Delete(
                outcome
            );


            await _outcomeRepo
                .SaveChangesAsync();
        }


        // =========================
        // Validate Course
        // =========================

        private async Task
            ValidateCourseAsync(int courseId)
        {
            var courseExists =
                await _courseRepo.ExistsAsync(
                    c => c.Id == courseId
                );


            if (!courseExists)
            {
                throw new KeyNotFoundException(
                    "Course was not found."
                );
            }
        }


        // =========================
        // Mapping
        // =========================

        private static CourseLearningOutcomeDto
            MapToDto(
                CourseLearningOutcome outcome)
        {
            return new CourseLearningOutcomeDto
            {
                Id =
                    outcome.Id,

                CourseId =
                    outcome.CourseId,

                Outcome =
                    outcome.Outcome,

                OrderIndex =
                    outcome.OrderIndex
            };
        }
    }
}
