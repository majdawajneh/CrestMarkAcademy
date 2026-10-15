using Application.Dto_s.Course;
using Application.Dto_s.CourseLearningOutcome;
using Application.Dto_s.CourseRequirement;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace Application.Services
{
    public class CourseService : ICourseService
    {
        private readonly IGenericRepository<Course> _courseRepo;
        private readonly IGenericRepository<Category> _categoryRepo;
        private readonly IGenericRepository<User> _userRepo;
        private readonly ICourseRepository _courseDetailsRepo;


        // =========================
        // Constructor
        // =========================

        public CourseService(
            IGenericRepository<Course> courseRepo,
            IGenericRepository<Category> categoryRepo,
            IGenericRepository<User> userRepo,
            ICourseRepository courseDetailsRepo)
        {
            _courseRepo = courseRepo;
            _categoryRepo = categoryRepo;
            _userRepo = userRepo;
            _courseDetailsRepo = courseDetailsRepo;
        }


        // =========================
        // Get All Courses
        // Admin
        // =========================

        public async Task<IEnumerable<CourseListDto>>GetAllForAdminAsync()
        {
            var courses = await _courseDetailsRepo.GetAllWithDetailsAsync();

            return courses.Select(MapToListDto).ToList();
        }

        // =========================
        // Get Published Courses
        // Public
        // =========================

        public async Task<IEnumerable<CourseListDto>>GetPublishedAsync()
        {
            var courses = await _courseDetailsRepo.GetPublishedWithDetailsAsync();

            return courses.Select(MapToListDto).ToList();
        }

        // =========================
        // Get Course By Id
        // Admin
        // =========================

        public async Task<CourseDto?>GetByIdAsync(int id)
        {
            var course = await _courseDetailsRepo.GetByIdWithDetailsAsync(id);

            if (course == null)
            {
                return null;
            }

            return MapToDto(course);
        }

        // =========================
        // Get Course By Slug
        // Public
        // =========================

        public async Task<CourseDto?> GetBySlugAsync(string slug)
        {
            if (string.IsNullOrWhiteSpace(slug))
            {
                return null;
            }

            var normalizedSlug = slug.Trim().ToLowerInvariant();

            var course = await _courseDetailsRepo.GetBySlugWithDetailsAsync(normalizedSlug, publishedOnly: true);

            if (course == null)
            {
                return null;
            }

            return MapToDto(course);
        }

        // =========================
        // Create Course
        // =========================

        public async Task<CourseDto>CreateAsync(CreateCourseDto dto)
        {
            var title = dto.Title.Trim();

            // Validate Category

            await ValidateCategoryAsync(dto.CategoryId);

            // Validate Instructor

            await ValidateInstructorAsync(dto.InstructorId);

            // Validate Prices

            ValidatePrices(dto.Price,dto.DiscountPrice);

            // Check Duplicate Title

            var titleExists =await _courseDetailsRepo.TitleExistsAsync(title);

            if (titleExists)
            {
                throw new InvalidOperationException("A course with this title already exists.");
            }

            // Generate Slug

            var slug = GenerateSlug(title);

            var slugExists = await _courseDetailsRepo.SlugExistsAsync(slug);

            if (slugExists)
            {
                throw new InvalidOperationException("A course with this slug already exists.");
            }

            // Create Entity

            var course = new Course
            {
                CategoryId =dto.CategoryId,

                InstructorId =dto.InstructorId,

                Title =title,

                Slug =slug,

                ShortDescription = CleanOptionalText(dto.ShortDescription),

                Description = dto.Description.Trim(),

                ThumbnailUrl = CleanOptionalText(dto.ThumbnailUrl),

                PreviewVideoUrl = CleanOptionalText(dto.PreviewVideoUrl),

                Price = dto.Price,

                DiscountPrice =dto.DiscountPrice,

                Language =dto.Language.Trim(),

                Level =dto.Level.Trim(),

                Status ="Draft",

                IsFeatured =dto.IsFeatured,

                HasCertificate =dto.HasCertificate,

                EstimatedDurationHours =dto.EstimatedDurationHours,

                CreatedAt =DateTime.UtcNow,

                UpdatedAt =null,

                PublishedAt =null
            };

            await _courseRepo.AddAsync(course);
            await _courseRepo.SaveChangesAsync();

            // Reload With Details

            var createdCourse =await _courseDetailsRepo.GetByIdWithDetailsAsync(course.Id);

            if (createdCourse == null)
            {
                throw new InvalidOperationException("Course was created but could not be loaded.");
            }

            return MapToDto(createdCourse);
        }


        // =========================
        // Update Course
        // =========================

        public async Task<CourseDto>UpdateAsync(int id,UpdateCourseDto dto)
        {
            var course =await _courseRepo.GetByIdAsync(id);


            if (course == null)
            {
                throw new KeyNotFoundException("Course was not found.");
            }

            var title =dto.Title.Trim();

            // Validate Category

            await ValidateCategoryAsync(dto.CategoryId
            );

            // Validate Instructor

            await ValidateInstructorAsync(dto.InstructorId);

            // Validate Prices

            ValidatePrices(dto.Price,dto.DiscountPrice);

            // Check Duplicate Title

            var titleExists =await _courseDetailsRepo.TitleExistsAsync(title,id);

            if (titleExists)
            {
                throw new InvalidOperationException("A course with this title already exists.");
            }

            /*
             * If the course has NEVER been published,
             * changing the title can also change the slug.
             *
             * Once a course has been published,
             * we keep its slug stable so old URLs do not break.
             */

            if (!course.PublishedAt.HasValue)
            {
                var newSlug =GenerateSlug(title);

                var slugExists =await _courseDetailsRepo.SlugExistsAsync(newSlug,id);

                if (slugExists)
                {
                    throw new InvalidOperationException(
                        "A course with this slug already exists."
                    );
                }


                course.Slug =
                    newSlug;
            }


            // Update Entity

            course.CategoryId =
                dto.CategoryId;

            course.InstructorId =
                dto.InstructorId;

            course.Title =
                title;

            course.ShortDescription =
                CleanOptionalText(
                    dto.ShortDescription
                );

            course.Description =
                dto.Description.Trim();

            course.ThumbnailUrl =
                CleanOptionalText(
                    dto.ThumbnailUrl
                );

            course.PreviewVideoUrl =
                CleanOptionalText(
                    dto.PreviewVideoUrl
                );

            course.Price =
                dto.Price;

            course.DiscountPrice =
                dto.DiscountPrice;

            course.Language =
                dto.Language.Trim();

            course.Level =
                dto.Level.Trim();

            course.IsFeatured =
                dto.IsFeatured;

            course.HasCertificate =
                dto.HasCertificate;

            course.EstimatedDurationHours =
                dto.EstimatedDurationHours;

            course.UpdatedAt =
                DateTime.UtcNow;


            _courseRepo.Update(course);


            await _courseRepo
                .SaveChangesAsync();


            return await ReloadCourseAsync(id);
        }


        // =========================
        // Publish Course
        // =========================

        public async Task<CourseDto>
            PublishAsync(int id)
        {
            var course =
                await GetCourseForUpdateAsync(id);


            if (course.Status == "Published")
            {
                return await ReloadCourseAsync(id);
            }


            if (course.Status == "Archived")
            {
                throw new InvalidOperationException(
                    "Archived courses must be restored to Draft before publishing."
                );
            }


            await ValidateCourseForPublishingAsync(
                course
            );


            course.Status =
                "Published";

            /*
             * Keep the first publication date.
             * If the course was unpublished and published again,
             * we do not overwrite the original PublishedAt.
             */

            course.PublishedAt ??=
                DateTime.UtcNow;

            course.UpdatedAt =
                DateTime.UtcNow;


            _courseRepo.Update(course);


            await _courseRepo
                .SaveChangesAsync();


            return await ReloadCourseAsync(id);
        }


        // =========================
        // Unpublish Course
        // Published -> Draft
        // =========================

        public async Task<CourseDto>
            UnpublishAsync(int id)
        {
            var course =
                await GetCourseForUpdateAsync(id);


            if (course.Status == "Draft")
            {
                return await ReloadCourseAsync(id);
            }


            if (course.Status == "Archived")
            {
                throw new InvalidOperationException(
                    "Archived courses cannot be unpublished. Restore the course first."
                );
            }


            course.Status =
                "Draft";

            course.UpdatedAt =
                DateTime.UtcNow;


            _courseRepo.Update(course);


            await _courseRepo
                .SaveChangesAsync();


            return await ReloadCourseAsync(id);
        }


        // =========================
        // Archive Course
        // =========================

        public async Task<CourseDto>
            ArchiveAsync(int id)
        {
            var course =
                await GetCourseForUpdateAsync(id);


            if (course.Status == "Archived")
            {
                return await ReloadCourseAsync(id);
            }


            course.Status =
                "Archived";

            course.UpdatedAt =
                DateTime.UtcNow;


            _courseRepo.Update(course);


            await _courseRepo
                .SaveChangesAsync();


            return await ReloadCourseAsync(id);
        }


        // =========================
        // Restore Archived Course
        // Archived -> Draft
        // =========================

        public async Task<CourseDto>
            RestoreToDraftAsync(int id)
        {
            var course =
                await GetCourseForUpdateAsync(id);


            if (course.Status != "Archived")
            {
                throw new InvalidOperationException(
                    "Only archived courses can be restored."
                );
            }


            course.Status =
                "Draft";

            course.UpdatedAt =
                DateTime.UtcNow;


            _courseRepo.Update(course);


            await _courseRepo
                .SaveChangesAsync();


            return await ReloadCourseAsync(id);
        }


        // =========================
        // Validate Category
        // =========================

        private async Task ValidateCategoryAsync(
            int categoryId)
        {
            var category =
                await _categoryRepo
                    .GetByIdAsync(categoryId);


            if (category == null)
            {
                throw new KeyNotFoundException(
                    "Category was not found."
                );
            }


            if (!category.IsActive)
            {
                throw new InvalidOperationException(
                    "The selected category is inactive."
                );
            }
        }


        // =========================
        // Validate Instructor
        // =========================

        private async Task ValidateInstructorAsync(
            int? instructorId)
        {
            if (!instructorId.HasValue)
            {
                return;
            }


            var instructor =
                await _userRepo
                    .GetByIdAsync(
                        instructorId.Value
                    );


            if (instructor == null)
            {
                throw new KeyNotFoundException(
                    "Instructor was not found."
                );
            }


            if (!instructor.IsActive)
            {
                throw new InvalidOperationException(
                    "The selected instructor is inactive."
                );
            }
        }


        // =========================
        // Validate Prices
        // =========================

        private static void ValidatePrices(
            decimal price,
            decimal? discountPrice)
        {
            if (price < 0)
            {
                throw new ArgumentException(
                    "Course price cannot be negative."
                );
            }


            if (!discountPrice.HasValue)
            {
                return;
            }


            if (discountPrice.Value < 0)
            {
                throw new ArgumentException(
                    "Discount price cannot be negative."
                );
            }


            if (discountPrice.Value >= price)
            {
                throw new ArgumentException(
                    "Discount price must be lower than the original price."
                );
            }
        }


        // =========================
        // Validate Before Publish
        // =========================

        private async Task
            ValidateCourseForPublishingAsync(
                Course course)
        {
            if (string.IsNullOrWhiteSpace(
                course.Title))
            {
                throw new InvalidOperationException(
                    "Course title is required before publishing."
                );
            }


            if (string.IsNullOrWhiteSpace(
                course.Description))
            {
                throw new InvalidOperationException(
                    "Course description is required before publishing."
                );
            }


            if (string.IsNullOrWhiteSpace(
                course.Language))
            {
                throw new InvalidOperationException(
                    "Course language is required before publishing."
                );
            }


            if (string.IsNullOrWhiteSpace(
                course.Level))
            {
                throw new InvalidOperationException(
                    "Course level is required before publishing."
                );
            }


            await ValidateCategoryAsync(
                course.CategoryId
            );


            await ValidateInstructorAsync(
                course.InstructorId
            );


            ValidatePrices(
                course.Price,
                course.DiscountPrice
            );
        }


        // =========================
        // Get Tracked Course
        // =========================

        private async Task<Course>
            GetCourseForUpdateAsync(int id)
        {
            var course =
                await _courseRepo
                    .GetByIdAsync(id);


            if (course == null)
            {
                throw new KeyNotFoundException(
                    "Course was not found."
                );
            }


            return course;
        }


        // =========================
        // Reload Course With Details
        // =========================

        private async Task<CourseDto>ReloadCourseAsync(int id)
        {
            var course =await _courseDetailsRepo.GetByIdWithDetailsAsync(id);

            if (course == null)
            {
                throw new KeyNotFoundException(
                    "Course was not found."
                );
            }


            return MapToDto(course);
        }


        // =========================
        // Generate Slug
        // =========================

        private static string GenerateSlug(
            string value)
        {
            var slug =
                value
                    .Trim()
                    .ToLowerInvariant();


            slug = Regex.Replace(
                slug,
                @"[^\p{L}\p{N}]+",
                "-"
            );


            slug =
                slug.Trim('-');


            if (string.IsNullOrWhiteSpace(slug))
            {
                throw new InvalidOperationException(
                    "Unable to generate course slug."
                );
            }


            return slug;
        }


        // =========================
        // Clean Optional Text
        // =========================

        private static string?
            CleanOptionalText(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }


            return value.Trim();
        }


        // =========================
        // Map Course -> CourseDto
        // =========================


        private static CourseDto MapToDto(Course course)
        {
            return new CourseDto
            {
                Id = course.Id,

                CategoryId = course.CategoryId,

                CategoryName = course.Category?.Name
                    ?? string.Empty,

                InstructorId = course.InstructorId,

                InstructorName = GetInstructorName(
                    course.Instructor
                ),

                Title = course.Title,

                Slug = course.Slug,

                ShortDescription = course.ShortDescription,

                Description = course.Description,

                ThumbnailUrl = course.ThumbnailUrl,

                PreviewVideoUrl = course.PreviewVideoUrl,

                Price = course.Price,

                DiscountPrice = course.DiscountPrice,

                Language = course.Language,

                Level = course.Level,

                Status = course.Status,

                IsFeatured = course.IsFeatured,

                HasCertificate = course.HasCertificate,

                EstimatedDurationHours =
                    course.EstimatedDurationHours,

                CreatedAt = course.CreatedAt,

                UpdatedAt = course.UpdatedAt,

                PublishedAt = course.PublishedAt,

                // Course Requirements
                Requirements = course.Requirements
                    .OrderBy(r => r.OrderIndex)
                    .Select(r => new CourseRequirementDto
                    {
                        Id = r.Id,
                        CourseId = r.CourseId,
                        Requirement = r.Requirement,
                        OrderIndex = r.OrderIndex
                    })
                    .ToList(),

                // Course Learning Outcomes
                LearningOutcomes = course.LearningOutcomes
                    .OrderBy(o => o.OrderIndex)
                    .Select(o => new CourseLearningOutcomeDto
                    {
                        Id = o.Id,
                        CourseId = o.CourseId,
                        Outcome = o.Outcome,
                        OrderIndex = o.OrderIndex
                    })
                    .ToList()
            };
        }



        // =========================
        // Map Course -> CourseListDto
        // =========================

        private static CourseListDto
            MapToListDto(Course course)
        {
            return new CourseListDto
            {
                Id =
                    course.Id,

                Title =
                    course.Title,

                Slug =
                    course.Slug,

                ShortDescription =
                    course.ShortDescription,

                ThumbnailUrl =
                    course.ThumbnailUrl,

                Price =
                    course.Price,

                DiscountPrice =
                    course.DiscountPrice,

                Language = course.Language,

                Level = course.Level,

                Status = course.Status,

                CategoryName = course.Category?.Name ?? string.Empty,

                InstructorName =
                    GetInstructorName(
                        course.Instructor
                    ),

                IsFeatured =
                    course.IsFeatured,

                ReviewsCount =
                    course.Reviews?.Count
                    ?? 0,

                EnrollmentCount =
                    course.Enrollments?.Count
                    ?? 0
            };
        }


        // =========================
        // Instructor Full Name
        // =========================

        private static string?
            GetInstructorName(User? instructor)
        {
            if (instructor == null)
            {
                return null;
            }


            var fullName =
                $"{instructor.FirstName} {instructor.LastName}"
                    .Trim();


            return string.IsNullOrWhiteSpace(
                fullName)
                ? instructor.Username
                : fullName;
        }
    }
}
