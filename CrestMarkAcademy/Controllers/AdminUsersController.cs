using Application.Dto_s.User;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController
        : ControllerBase
    {
        private readonly IAdminUserService
            _adminUserService;


        public AdminUsersController(
            IAdminUserService adminUserService)
        {
            _adminUserService =
                adminUserService;
        }


        // =========================
        // Get All Users
        // =========================

        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<AdminUserListDto>>>
            GetAll()
        {
            var users =
                await _adminUserService
                    .GetAllAsync();


            return Ok(users);
        }


        // =========================
        // Get User By Id
        // =========================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<AdminUserDetailsDto>>
            GetById(
                int id)
        {
            var user =
                await _adminUserService
                    .GetByIdAsync(
                        id
                    );


            return Ok(user);
        }


        // =========================
        // Deactivate
        // =========================

        [HttpPatch("{id:int}/deactivate")]
        public async Task<IActionResult>
            Deactivate(
                int id)
        {
            var adminUserId =
                GetCurrentUserId();


            await _adminUserService
                .DeactivateAsync(
                    adminUserId,
                    id
                );


            return NoContent();
        }


        // =========================
        // Activate
        // =========================

        [HttpPatch("{id:int}/activate")]
        public async Task<IActionResult>
            Activate(
                int id)
        {
            await _adminUserService
                .ActivateAsync(
                    id
                );


            return NoContent();
        }


        private int GetCurrentUserId()
        {
            var value =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );


            if (!int.TryParse(
                    value,
                    out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Invalid user token."
                );
            }


            return userId;
        }
    }
}