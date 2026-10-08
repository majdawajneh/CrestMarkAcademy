using Application.Dto_s.CourseSection;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;


namespace Application.Services
{
    public class CourseSectionService
        : ICourseSectionService
    {
        private readonly
            IGenericRepository<CourseSection>
            _sectionRepo;

        private readonly
            IGenericRepository<Course>
            _courseRepo;


        // =========================
        // Constructor
        // =========================

        public CourseSectionService(
            IGenericRepository<CourseSection> sectionRepo,
            IGenericRepository<Course> courseRepo)
        {
            _sectionRepo = sectionRepo;
            _courseRepo = courseRepo;
        }


        // =========================
        // Get Sections By Course
        // =========================

        public async Task<
            IEnumerable<CourseSectionDto>>
            GetByCourseIdAsync(int courseId)
        {
            await ValidateCourseAsync(courseId);


            var sections =
                await _sectionRepo.FindAsync(
                    s => s.CourseId == courseId
                );


            return sections
                .OrderBy(s => s.OrderIndex)
                .Select(MapToDto)
                .ToList();
        }


        // =========================
        // Get Section By Id
        // =========================

        public async Task<CourseSectionDto?>
            GetByIdAsync(int id)
        {
            var section =
                await _sectionRepo
                    .GetByIdAsync(id);


            if (section == null)
            {
                return null;
            }


            return MapToDto(section);
        }


        // =========================
        // Create Section
        // =========================

        public async Task<CourseSectionDto>
            CreateAsync(
                int courseId,
                CreateCourseSectionDto dto)
        {
            await ValidateCourseAsync(courseId);


            var section =
                new CourseSection
                {
                    CourseId =
                        courseId,

                    Title =
                        dto.Title.Trim(),

                    Description =
                        CleanOptionalText(
                            dto.Description
                        ),

                    OrderIndex =
                        dto.OrderIndex
                };


            await _sectionRepo
                .AddAsync(section);


            await _sectionRepo
                .SaveChangesAsync();


            return MapToDto(section);
        }


        // =========================
        // Update Section
        // =========================

        public async Task<CourseSectionDto>
            UpdateAsync(
                int courseId,
                int id,
                UpdateCourseSectionDto dto)
        {
            await ValidateCourseAsync(courseId);


            var section =
                await _sectionRepo
                    .GetByIdAsync(id);


            if (section == null ||
                section.CourseId != courseId)
            {
                throw new KeyNotFoundException(
                    "Course section was not found."
                );
            }


            section.Title =
                dto.Title.Trim();

            section.Description =
                CleanOptionalText(
                    dto.Description
                );

            section.OrderIndex =
                dto.OrderIndex;


            _sectionRepo.Update(section);


            await _sectionRepo
                .SaveChangesAsync();


            return MapToDto(section);
        }


        // =========================
        // Delete Section
        // =========================

        public async Task DeleteAsync(
            int courseId,
            int id)
        {
            var section =
                await _sectionRepo
                    .GetByIdAsync(id);


            if (section == null ||
                section.CourseId != courseId)
            {
                throw new KeyNotFoundException(
                    "Course section was not found."
                );
            }


            _sectionRepo.Delete(section);


            await _sectionRepo
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
        // Mapping
        // =========================

        private static CourseSectionDto
            MapToDto(
                CourseSection section)
        {
            return new CourseSectionDto
            {
                Id =
                    section.Id,

                CourseId =
                    section.CourseId,

                Title =
                    section.Title,

                Description =
                    section.Description,

                OrderIndex =
                    section.OrderIndex
            };
        }
    }
}