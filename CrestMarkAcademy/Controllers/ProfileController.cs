using Application.Dto_s.Profile;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/profile")]
    [Authorize]
    public class ProfileController
        : ControllerBase
    {
        private readonly IProfileService
            _profileService;


        public ProfileController(
            IProfileService profileService)
        {
            _profileService =
                profileService;
        }


        // =========================
        // Get My Profile
        // =========================

        [HttpGet]
        public async Task<ActionResult<ProfileDto>>
            GetMyProfile()
        {
            var userId =
                GetCurrentUserId();


            var profile =
                await _profileService
                    .GetMyProfileAsync(
                        userId
                    );


            return Ok(profile);
        }


        // =========================
        // Update My Profile
        // =========================

        [HttpPut]
        public async Task<ActionResult<ProfileDto>>
            UpdateMyProfile(
                UpdateProfileDto dto)
        {
            var userId =
                GetCurrentUserId();


            var profile =
                await _profileService
                    .UpdateMyProfileAsync(
                        userId,
                        dto
                    );


            return Ok(profile);
        }


        // =========================
        // Current User Id
        // =========================

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