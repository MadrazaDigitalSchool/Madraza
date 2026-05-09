package com.madraza.config;

import com.madraza.entity.Rol;
import com.madraza.entity.Usuario;
import com.madraza.repository.RolRepository;
import com.madraza.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Rol rolUser  = crearRolSiNoExiste("ROLE_USER",   "Usuario estándar");
        Rol rolAdmin = crearRolSiNoExiste("ROLE_ADMIN",  "Administrador del sistema");
        crearRolSiNoExiste("ROLE_EDITOR", "Editor — puede crear y editar tests");
        crearRolSiNoExiste("ROLE_VIEWER", "Solo ver — acceso de solo lectura");

        crearAdminSiNoExiste(rolUser, rolAdmin);
        crearUsuarioPruebaSiNoExiste(rolUser);
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

        System.out.println("[DataInitializer] Admin creado: admin@madraza.com / Admin1234!");
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

        System.out.println("[DataInitializer] Usuario de prueba creado: test@madraza.com / Test1234!");
    }
}
