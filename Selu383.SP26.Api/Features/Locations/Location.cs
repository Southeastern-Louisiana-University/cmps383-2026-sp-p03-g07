using Selu383.SP26.Api.Features.Auth;

namespace Selu383.SP26.Api.Features.Locations;

public class Location
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string State { get; set; } = string.Empty;

    public string Zip { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string HoursOfOperation { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public int TableCount { get; set; }

    public int? ManagerId { get; set; }
    public virtual User? Manager { get; set; }
}
