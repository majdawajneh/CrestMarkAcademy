using Application.Dto_s.LessonResource;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;


namespace Application.Services
{
    public class LessonResourceService
        : ILessonResourceService
    {
        private readonly
            IGenericRepository<LessonResource>
            _resourceRepo;

        private readonly
            IGenericRepository<Lesson>
            _lessonRepo;


        // =========================
        // Constructor
        // =========================

        public LessonResourceService(
            IGenericRepository<LessonResource> resourceRepo,
            IGenericRepository<Lesson> lessonRepo)
        {
            _resourceRepo = resourceRepo;
            _lessonRepo = lessonRepo;
        }


        // =========================
        // Get Resources By Lesson
        // =========================

        public async Task<IEnumerable<LessonResourceDto>>
            GetByLessonIdAsync(int lessonId)
        {
            await ValidateLessonAsync(lessonId);


            var resources =
                await _resourceRepo.FindAsync(
                    r => r.LessonId == lessonId
                );


            return resources
                .OrderBy(r => r.OrderIndex)
                .Select(MapToDto)
                .ToList();
        }


        // =========================
        // Get Resource By Id
        // =========================

        public async Task<LessonResourceDto?>
            GetByIdAsync(int id)
        {
            var resource =
                await _resourceRepo
                    .GetByIdAsync(id);


            if (resource == null)
            {
                return null;
            }


            return MapToDto(resource);
        }


        // =========================
        // Create Resource
        // =========================

        public async Task<LessonResourceDto>
            CreateAsync(
                int lessonId,
                CreateLessonResourceDto dto)
        {
            await ValidateLessonAsync(lessonId);


            var resourceType =
                NormalizeResourceType(
                    dto.ResourceType
                );


            var resource =
                new LessonResource
                {
                    LessonId =
                        lessonId,

                    Title =
                        dto.Title.Trim(),

                    ResourceUrl =
                        dto.ResourceUrl.Trim(),

                    ResourceType =
                        resourceType,

                    OrderIndex =
                        dto.OrderIndex,

                    IsDownloadable =
                        dto.IsDownloadable
                };


            await _resourceRepo
                .AddAsync(resource);


            await _resourceRepo
                .SaveChangesAsync();


            return MapToDto(resource);
        }


        // =========================
        // Update Resource
        // =========================

        public async Task<LessonResourceDto>
            UpdateAsync(
                int lessonId,
                int id,
                UpdateLessonResourceDto dto)
        {
            await ValidateLessonAsync(lessonId);


            var resource =
                await _resourceRepo
                    .GetByIdAsync(id);


            if (resource == null ||
                resource.LessonId != lessonId)
            {
                throw new KeyNotFoundException(
                    "Lesson resource was not found."
                );
            }


            var resourceType =
                NormalizeResourceType(
                    dto.ResourceType
                );


            resource.Title =
                dto.Title.Trim();

            resource.ResourceUrl =
                dto.ResourceUrl.Trim();

            resource.ResourceType =
                resourceType;

            resource.OrderIndex =
                dto.OrderIndex;

            resource.IsDownloadable =
                dto.IsDownloadable;


            _resourceRepo.Update(resource);


            await _resourceRepo
                .SaveChangesAsync();


            return MapToDto(resource);
        }


        // =========================
        // Delete Resource
        // =========================

        public async Task DeleteAsync(
            int lessonId,
            int id)
        {
            var resource =
                await _resourceRepo
                    .GetByIdAsync(id);


            if (resource == null ||
                resource.LessonId != lessonId)
            {
                throw new KeyNotFoundException(
                    "Lesson resource was not found."
                );
            }


            _resourceRepo.Delete(resource);


            await _resourceRepo
                .SaveChangesAsync();
        }


        // =========================
        // Validate Lesson
        // =========================

        private async Task
            ValidateLessonAsync(int lessonId)
        {
            var lessonExists =
                await _lessonRepo.ExistsAsync(
                    l => l.Id == lessonId
                );


            if (!lessonExists)
            {
                throw new KeyNotFoundException(
                    "Lesson was not found."
                );
            }
        }


        // =========================
        // Normalize Resource Type
        // =========================

        private static string
            NormalizeResourceType(string resourceType)
        {
            var normalized =
                resourceType
                    .Trim()
                    .ToLowerInvariant();


            return normalized switch
            {
                "file" =>
                    "File",

                "link" =>
                    "Link",

                "pdf" =>
                    "PDF",

                "sourcecode" =>
                    "SourceCode",

                "source-code" =>
                    "SourceCode",

                "source code" =>
                    "SourceCode",

                _ => throw new InvalidOperationException(
                    "Resource type must be File, Link, PDF, or SourceCode."
                )
            };
        }


        // =========================
        // Mapping
        // =========================

        private static LessonResourceDto
            MapToDto(
                LessonResource resource)
        {
            return new LessonResourceDto
            {
                Id =
                    resource.Id,

                LessonId =
                    resource.LessonId,

                Title =
                    resource.Title,

                ResourceUrl =
                    resource.ResourceUrl,

                ResourceType =
                    resource.ResourceType,

                OrderIndex =
                    resource.OrderIndex,

                IsDownloadable =
                    resource.IsDownloadable
            };
        }
    }
}