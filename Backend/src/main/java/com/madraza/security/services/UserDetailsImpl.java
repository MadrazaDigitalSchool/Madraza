package com.madraza.security.services;

import com.madraza.entity.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author Hafdala Mehdi Sidi
 */
public class UserDetailsImpl implements UserDetails {

    private final Long id;
    private final String nombre;
    private final String email;
    private final String password;
    private final boolean emailVerificado;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(Long id, String nombre, String email,
                           String password, boolean emailVerificado,
                           Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.password = password;
        this.emailVerificado = emailVerificado;
        this.authorities = authorities;
    }

    public static UserDetailsImpl build(Usuario usuario) {
        List<GrantedAuthority> authorities = usuario.getRoles().stream()
                .map(rol -> new SimpleGrantedAuthority(rol.getNombre()))
                .collect(Collectors.toList());

        return new UserDetailsImpl(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getPassword(),
                usuario.isEmailVerificado(),
                authorities);
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }

    @Override public String getUsername() { return email; }
    @Override public String getPassword() { return password; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return emailVerificado; }
}