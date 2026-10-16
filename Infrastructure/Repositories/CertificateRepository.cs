
using Application.Repositories.Interfaces;
using Domain.Entities.Learning;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class CertificateRepository : ICertificateRepository
    {
        private readonly CrestMark_DbContext _context;

        public CertificateRepository(CrestMark_DbContext context)
        {
            _context = context;
        }

        // =========================
        // Get All Certificates
        // Admin
        // =========================

        public async Task<IEnumerable<Certificate>>
            GetAllWithDetailsAsync()
        {
            return await _context
                .Set<Certificate>()
                .AsNoTracking()
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.User)
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.Course)
                .OrderByDescending(c => c.IssuedAt)
                .ThenByDescending(c => c.Id)
                .ToListAsync();
        }

        // =========================
        // Get Certificate By ID
        // =========================

        public async Task<Certificate?>
            GetByIdWithDetailsAsync(int id)
        {
            return await _context
                .Set<Certificate>()
                .AsNoTracking()
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.User)
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.Course)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        // =========================
        // Get Certificate By Enrollment
        // =========================

        public async Task<Certificate?>
            GetByEnrollmentIdWithDetailsAsync(int enrollmentId)
        {
            return await _context
                .Set<Certificate>()
                .AsNoTracking()
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.User)
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.Course)
                .FirstOrDefaultAsync(
                    c => c.EnrollmentId == enrollmentId);
        }

        // =========================
        // Get Certificate By Number
        // =========================

        public async Task<Certificate?>
            GetByCertificateNumberWithDetailsAsync(
                string certificateNumber)
        {
            return await _context
                .Set<Certificate>()
                .AsNoTracking()
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.User)
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.Course)
                .FirstOrDefaultAsync(
                    c => c.CertificateNumber == certificateNumber);
        }

        // =========================
        // Get User Certificates
        // =========================

        public async Task<IEnumerable<Certificate>>
            GetByUserIdWithDetailsAsync(int userId)
        {
            return await _context
                .Set<Certificate>()
                .AsNoTracking()
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.User)
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.Course)
                .Where(c => c.Enrollment.UserId == userId)
                .OrderByDescending(c => c.IssuedAt)
                .ToListAsync();
        }

        // =========================
        // Check Certificate Number
        // =========================

        public async Task<bool>
            CertificateNumberExistsAsync(
                string certificateNumber)
        {
            return await _context
                .Set<Certificate>()
                .AsNoTracking()
                .AnyAsync(
                    c => c.CertificateNumber == certificateNumber);
        }
    }
}
