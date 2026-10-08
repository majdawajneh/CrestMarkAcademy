using Application.Dto_s.CourseRequirement;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services
{
    public class CourseRequirementService : ICourseRequirementService
    {
        private readonly
           IGenericRepository<CourseRequirement>
           _requirementRepo;

        private readonly
            IGenericRepository<Course>
            _courseRepo;


        // =========================
        // Constructor
        // =========================

        public CourseRequirementService(
            IGenericRepository<CourseRequirement> requirementRepo,
            IGenericRepository<Course> courseRepo)
        {
            _requirementRepo = requirementRepo;
            _courseRepo = courseRepo;
        }


        // =========================
        // Get Requirements By Course
        // =========================

        public async Task<
            IEnumerable<CourseRequirementDto>>
            GetByCourseIdAsync(int courseId)
        {
            await ValidateCourseAsync(courseId);


            var requirements =
                await _requirementRepo.FindAsync(
                    r => r.CourseId == courseId
                );


            return requirements
                .OrderBy(r => r.OrderIndex)
                .Select(MapToDto)
                .ToList();
        }


        // =========================
        // Get Requirement By Id
        // =========================

        public async Task<CourseRequirementDto?>
            GetByIdAsync(int id)
        {
            var requirement =
                await _requirementRepo
                    .GetByIdAsync(id);


            if (requirement == null)
            {
                return null;
            }


            return MapToDto(requirement);
        }


        // =========================
        // Create Requirement
        // =========================

        public async Task<CourseRequirementDto>
            CreateAsync(
                int courseId,
                CreateCourseRequirementDto dto)
        {
            await ValidateCourseAsync(courseId);


            var requirement =
                new CourseRequirement
                {
                    CourseId =
                        courseId,

                    Requirement =
                        dto.Requirement.Trim(),

                    OrderIndex =
                        dto.OrderIndex
                };


            await _requirementRepo
                .AddAsync(requirement);


            await _requirementRepo
                .SaveChangesAsync();


            return MapToDto(requirement);
        }


        // =========================
        // Update Requirement
        // =========================

        public async Task<CourseRequirementDto>
            UpdateAsync(
                int courseId,
                int id,
                UpdateCourseRequirementDto dto)
        {
            await ValidateCourseAsync(courseId);


            var requirement =
                await _requirementRepo
                    .GetByIdAsync(id);


            if (requirement == null ||
                requirement.CourseId != courseId)
            {
                throw new KeyNotFoundException(
                    "Course requirement was not found."
                );
            }


            requirement.Requirement =
                dto.Requirement.Trim();

            requirement.OrderIndex =
                dto.OrderIndex;


            _requirementRepo.Update(
                requirement
            );


            await _requirementRepo
                .SaveChangesAsync();


            return MapToDto(requirement);
        }


        // =========================
        // Delete Requirement
        // =========================

        public async Task DeleteAsync(
            int courseId,
            int id)
        {
            var requirement =
                await _requirementRepo
                    .GetByIdAsync(id);


            if (requirement == null ||
                requirement.CourseId != courseId)
            {
                throw new KeyNotFoundException(
                    "Course requirement was not found."
                );
            }


            _requirementRepo.Delete(
                requirement
            );


            await _requirementRepo
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

        private static CourseRequirementDto
            MapToDto(
                CourseRequirement requirement)
        {
            return new CourseRequirementDto
            {
                Id =
                    requirement.Id,

                CourseId =
                    requirement.CourseId,

                Requirement =
                    requirement.Requirement,

                OrderIndex =
                    requirement.OrderIndex
            };
        }
    }
}
