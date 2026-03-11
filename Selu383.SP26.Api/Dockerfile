FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Selu383.SP26.Api/Selu383.SP26.Api.csproj Selu383.SP26.Api/
RUN dotnet restore Selu383.SP26.Api/Selu383.SP26.Api.csproj -p:SkipSpaProjectReference=true

COPY . .
RUN dotnet publish Selu383.SP26.Api/Selu383.SP26.Api.csproj -c Release -o /app/publish -p:SkipSpaProjectReference=true

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "Selu383.SP26.Api.dll"]
