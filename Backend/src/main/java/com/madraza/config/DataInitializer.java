package com.madraza.config;

import com.madraza.entity.Rol;
import com.madraza.entity.Usuario;
import com.madraza.repository.RolRepository;
import com.madraza.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Override
    public void run(String... args) {
        Rol rolUser  = crearRolSiNoExiste("ROLE_USER",   "Usuario estándar");
        Rol rolAdmin = crearRolSiNoExiste("ROLE_ADMIN",  "Administrador del sistema");
        crearRolSiNoExiste("ROLE_EDITOR", "Editor — puede crear y editar tests");
        crearRolSiNoExiste("ROLE_VIEWER", "Solo ver — acceso de solo lectura");

        crearAdminSiNoExiste(rolUser, rolAdmin);

        boolean esDev = Arrays.asList(environment.getActiveProfiles()).contains("dev");
        if (esDev) crearUsuarioPruebaSiNoExiste(rolUser);
    }

    private Rol crearRolSiNoExiste(String nombre, String descripcion) {
        return rolRepository.findByNombre(nombre).orElseGet(() -> {
            Rol rol = new Rol();
            rol.setNombre(nombre);
            rol.setDescripcion(descripcion);
            return rolRepository.save(rol);
        });
    }

    private void crearAdminSiNoExiste(Rol rolUser, Rol rolAdmin) {
        if (usuarioRepository.existsByEmail("admin@madraza.com")) return;

        Usuario admin = new Usuario();
        admin.setNombre("Admin");
        admin.setApellidos("Madraza");
        admin.setEmail("admin@madraza.com");
        admin.setPassword(passwordEncoder.encode("Admin1234!"));
        admin.setEmailVerificado(true);
        admin.setActivo(true);
        admin.setRoles(Set.of(rolUser, rolAdmin));
        usuarioRepository.save(admin);
        log.info("Admin creado: admin@madraza.com");
    }

    private void crearUsuarioPruebaSiNoExiste(Rol rolUser) {
        if (usuarioRepository.existsByEmail("test@madraza.com")) return;

        Usuario test = new Usuario();
        test.setNombre("Usuario");
        test.setApellidos("Test");
        test.setEmail("test@madraza.com");
        test.setPassword(passwordEncoder.encode("Test1234!"));
        test.setEmailVerificado(true);
        test.setActivo(true);
        test.setRoles(Set.of(rolUser));
        usuarioRepository.save(test);
        log.info("Usuario de prueba creado: test@madraza.com");
    }
}
